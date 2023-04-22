import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { HOUR } from 'lib/utils/time';

export const useApiSession = () => {
  const { data: isLoggedIn, isLoading: loggingIn } = useQuery({
    queryKey: ['login'],
    queryFn: () => axios.post('/api/login').then((res) => !!res?.data?.ok),
    staleTime: 12 * HOUR,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    retry: 5,
  });

  return { isLoggedIn, loggingIn };
};
