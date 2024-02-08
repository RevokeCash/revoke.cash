import { useQuery } from '@tanstack/react-query';
import ky from 'lib/ky';
import { HOUR } from 'lib/utils/time';

export const useApiSession = () => {
  const {
    data: isLoggedIn,
    isLoading: loggingIn,
    error,
  } = useQuery({
    queryKey: ['login'],
    queryFn: () => ky.post('/api/login').json<any>(),
    // .then((res) => !!res?.ok),
    staleTime: 12 * HOUR,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 5,
  });

  return { isLoggedIn, loggingIn, error };
};
