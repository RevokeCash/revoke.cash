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
  return <div className="mt-2">Error: {message}</div>;
};

export default Error;
