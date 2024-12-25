import { useQuery } from '@tanstack/react-query';
import { apiLogin } from 'lib/utils';
import { HOUR } from 'lib/utils/time';

export const useApiSession = () => {
  const {
    data: isLoggedIn,
    isLoading: loggingIn,
    error,
  } = useQuery({
    queryKey: ['login'],
    queryFn: apiLogin,
    staleTime: 12 * HOUR,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 5,
  });

  return { isLoggedIn, loggingIn, error };
};
