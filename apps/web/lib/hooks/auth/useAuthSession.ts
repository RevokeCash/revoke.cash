import { useQuery } from '@tanstack/react-query';
import { AUTH_SESSION_QUERY_KEY, type AuthSession, UNAUTHENTICATED_AUTH_SESSION } from 'lib/auth/session';
import ky from 'lib/ky';
import { MINUTE } from 'lib/utils/time';
import { useInitialAuthSession } from './AuthSessionProvider';

export const useAuthSession = () => {
  const initialSession = useInitialAuthSession();

  const { data, ...query } = useQuery({
    queryKey: AUTH_SESSION_QUERY_KEY,
    queryFn: () => ky.get('/api/auth/session').json<AuthSession>(),
    ...(initialSession ? { initialData: initialSession } : {}),
    staleTime: 5 * MINUTE,
  });
  const session = data ?? UNAUTHENTICATED_AUTH_SESSION;

  return {
    ...query,
    session,
    hasApiSession: session.hasApiSession,
    siweAddress: session.siweAddress,
  };
};
