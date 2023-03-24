import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useMounted } from 'lib/hooks/useMounted';
import { HOUR } from 'lib/utils/time';
import { ReactNode } from 'react';
import Spinner from './Spinner';

interface Props {
  showSpinner?: boolean;
  children?: ReactNode;
}

const LogIn = ({ children, showSpinner }: Props) => {
  const isMounted = useMounted();

  const { isLoading: loggingIn } = useQuery<void, Error>({
    queryKey: ['login', { persist: true }],
    queryFn: () => axios.post('/api/login').then((res) => res.data),
    staleTime: 12 * HOUR,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
  });

  if (!isMounted) return null;

  if (loggingIn) {
    if (showSpinner) {
      return (
        <div className="flex justify-center p-2 w-full">
          <Spinner className="w-6 h-6" />
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
};

export default LogIn;
