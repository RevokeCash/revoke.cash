import { useEthereum } from 'lib/hooks/useEthereum';
import { getChainName } from 'lib/utils/chains';
import { useEffect } from 'react';

interface Props {
  error: any;
}

const Error = ({ error }: Props) => {
  const { selectedChainId } = useEthereum();

  useEffect(() => {
    console.log(error);
  }, []);

  const errorMessage = error?.error?.message ?? error?.data?.message ?? error?.message;
  const chainConnectionMessage = `Could not connect to the ${getChainName(selectedChainId)} chain`;
  const message = errorMessage.includes('missing response') ? chainConnectionMessage : errorMessage;
  return <div>Error: {message}</div>;
};

export default Error;
