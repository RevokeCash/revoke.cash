import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Error from 'components/common/Error';
import { useAppContext } from 'lib/hooks/useAppContext';
import { ClipLoader } from 'react-spinners';
import AllowanceTable from './table/AllowanceTable';

const DashboardBody = () => {
  const { inputAddress, loading } = useAppContext();

  const { isLoading: loggingIn, error } = useQuery<void, Error>({
    queryKey: ['login'],
    queryFn: () => axios.post('/api/login'),
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  if (loading || loggingIn) {
    return (
      <div className="flex justify-center">
        <ClipLoader size={40} color={'#000'} loading={loading} />
      </div>
    );
  }

  if (error) return <Error error={error} />;

  if (!inputAddress) return null;

  return <AllowanceTable />;
};

export default DashboardBody;
