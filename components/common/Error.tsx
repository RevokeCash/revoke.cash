import { useEthereum } from 'lib/hooks/useEthereum';
import { getChainName } from 'lib/utils/chains';
import { useEffect } from 'react';

interface Props {
  error: Error;
}

const Error = ({ error }: Props) => {
  const { selectedChainId } = useEthereum();

  useEffect(() => {
    console.log(error);
  }, []);

  const chainConnectionMessage = `Could not connect to the ${getChainName(selectedChainId)} chain`;
  const message = error.message.includes('missing response') ? chainConnectionMessage : error.message;
  return <div style={{ marginTop: '20px' }}>Error: {message}</div>;
};

export default Error;
