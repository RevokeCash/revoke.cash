import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ReactNode } from 'react';
import Spinner from './Spinner';

interface Props {
  showSpinner?: boolean;
  children?: ReactNode;
}

const LogIn = ({ children, showSpinner }: Props) => {
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  const { isLoading: loggingIn } = useQuery<void, Error>({
    queryKey: ['login'],
    queryFn: () => axios.post('/api/login'),
    staleTime: TWELVE_HOURS,
    cacheTime: TWELVE_HOURS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
  });

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
