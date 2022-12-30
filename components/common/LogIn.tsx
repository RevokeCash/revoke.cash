import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Spinner from './Spinner';

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

const LogIn = ({ children }) => {
  const { isLoading: loggingIn } = useQuery<void, Error>({
    queryKey: ['login'],
    queryFn: () => axios.post('/api/login'),
    staleTime: TWELVE_HOURS,
    cacheTime: TWELVE_HOURS,
  });

  if (loggingIn) {
    return (
      <div className="flex justify-center p-2 w-full">
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  return children;
};

export default LogIn;
