import { SITE_URL } from '@revoke.cash/core/constants';
import kyBase from '@revoke.cash/core/ky';
import { MINUTE } from '@revoke.cash/core/utils/time';
import { queryClient } from 'lib/hooks/QueryProvider';
import type { Address } from 'viem';

export interface AuthSession {
  hasApiSession: boolean;
  siweAddress: Address | null;
}

export const AUTH_SESSION_QUERY_KEY = ['auth', 'session'] as const;
export const ENSURE_API_SESSION_QUERY_KEY = ['auth', 'ensure-session'] as const;

export const UNAUTHENTICATED_AUTH_SESSION: AuthSession = {
  hasApiSession: false,
  siweAddress: null,
};

// Establishes an anonymous API session before any own-site API request goes out
export const ensureApiSessionForRequest = async ({ request }: { request: Request }) => {
  if (!requiresApiSession(request)) return request;
  await ensureAuthSession();
  return request;
};

const requiresApiSession = (request: Request): boolean => {
  if (!isOwnSite(request.url)) return false;
  const path = new URL(request.url).pathname;
  return path.startsWith('/api/') && !path.startsWith('/api/auth/');
};

const isOwnSite = (url: string) => {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : SITE_URL;
  return new URL(url, siteUrl).origin === new URL(siteUrl).origin;
};

// The session calls go through the base client: the extended client skips its session hooks for
// /api/auth/ routes anyway, and this avoids a circular import between lib/ky and this file
const ensureAuthSession = async () => {
  // In a backend context, we do not need to login
  if (typeof window === 'undefined') return true;

  return queryClient.ensureQueryData({
    queryKey: ENSURE_API_SESSION_QUERY_KEY,
    staleTime: 5 * MINUTE,
    gcTime: 10 * MINUTE,
    queryFn: async () => {
      const authSession = await getAuthSession();

      if (authSession?.hasApiSession) {
        queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, authSession);
        return true;
      }

      const isLoggedIn = await kyBase
        .post('/api/auth/login')
        .json<{ ok?: boolean }>()
        .then((res) => Boolean(res?.ok))
        .catch(() => false);

      if (!isLoggedIn) {
        queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY, refetchType: 'none' });
        throw new Error('Failed to create API session');
      }

      const updatedAuthSession = await getAuthSession();
      if (updatedAuthSession?.hasApiSession) {
        queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, updatedAuthSession);
        return true;
      }

      queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY, refetchType: 'none' });
      throw new Error('Failed to create API session');
    },
  });
};

const getAuthSession = async (): Promise<AuthSession | null> => {
  return kyBase
    .get('/api/auth/session')
    .json<AuthSession>()
    .catch(() => null);
};

// The cached session bootstrap can outlive the session cookie (e.g. the session is destroyed on
// wallet disconnect, possibly in another tab); re-establish the session and retry the request once
export const retryWithFreshApiSession = async ({ request, response }: { request: Request; response: Response }) => {
  const isSessionFailure = await isMissingApiSessionFailure({ request, response });
  if (!isSessionFailure) return;

  const sessionEstablished = await recoverApiSession();
  if (!sessionEstablished) return;

  // A request body was already consumed when the request was sent, so only requests without a
  // body can be replayed; for the rest, the re-established session makes the next call succeed
  if (request.body !== null) return;

  // The retry goes through the base client, so a repeated failure cannot loop
  return kyBase(request.url, { method: request.method, headers: request.headers });
};

const isMissingApiSessionFailure = async ({
  request,
  response,
}: {
  request: Request;
  response: Response;
}): Promise<boolean> => {
  if (response.status !== 403 || !requiresApiSession(request)) return false;

  const body = await response
    .clone()
    .json()
    .catch(() => null);

  return body?.message === 'No API session is active';
};

// Many requests can fail simultaneously when the session dies; recovery is shared between them
// because clearing the cache while another recovery's login is in flight would cancel it
let apiSessionRecovery: Promise<boolean> | null = null;
const recoverApiSession = (): Promise<boolean> => {
  apiSessionRecovery ??= (async () => {
    try {
      queryClient.removeQueries({ queryKey: ENSURE_API_SESSION_QUERY_KEY });
      return Boolean(await ensureAuthSession());
    } catch {
      return false;
    } finally {
      apiSessionRecovery = null;
    }
  })();

  return apiSessionRecovery;
};
