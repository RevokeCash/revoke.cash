import { SITE_URL } from '@revoke.cash/core/constants';
import kyBase from '@revoke.cash/core/ky';
import { MINUTE } from '@revoke.cash/core/utils/time';
import { AUTH_SESSION_QUERY_KEY, type AuthSession } from './auth/session';
import { queryClient } from './hooks/QueryProvider';

const ky = kyBase.extend({
  hooks: {
    beforeRequest: [
      async (request) => {
        if (!isOwnSite(request.url)) return request;

        const path = new URL(request.url).pathname;
        if (!path.startsWith('/api/')) return request;
        if (path.startsWith('/api/auth/')) return request;

        await ensureAuthSession();

        return request;
      },
    ],
  },
});

const isOwnSite = (url: string) => {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : SITE_URL;
  return new URL(url, siteUrl).origin === new URL(siteUrl).origin;
};

export default ky;

const ensureAuthSession = async () => {
  // In a backend context, we do not need to login
  if (typeof window === 'undefined') return true;

  return queryClient.ensureQueryData({
    queryKey: ['auth', 'ensure-session'],
    staleTime: 5 * MINUTE,
    gcTime: 10 * MINUTE,
    queryFn: async () => {
      const authSession = await getAuthSession();

      if (authSession?.hasApiSession) {
        queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, authSession);
        return true;
      }

      const isLoggedIn = await ky
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
  return ky
    .get('/api/auth/session')
    .json<AuthSession>()
    .catch(() => null);
};
