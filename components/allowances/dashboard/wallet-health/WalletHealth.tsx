import { ChainId } from '@revoke.cash/chains';
import { useQuery } from '@tanstack/react-query';
import { isNullish } from 'lib/utils';
import type { Address } from 'viem';
import WalletHealthDescription from './WalletHealthDescription';
import WalletHealthScore from './WalletHealthScore';

interface Props {
  address: Address;
  chainId: number;
}

// TODO: Implement the actual score calculation

const WalletHealth = ({ address, chainId }: Props) => {
  // TODO: Make the refreshing depend on new events (same events == same score)
  const {
    data: score = 0,
    isLoading,
    error,
  } = useQuery<number, Error>({
    queryKey: ['walletHealthScore', chainId, address],
    queryFn: () => 100,
    enabled: !isNullish(address) && chainId === ChainId.EthereumMainnet,
  });

  if (chainId !== ChainId.EthereumMainnet) return null;
  if (error) return null;

  return (
    <div className="flex items-center justify-center gap-2 only:w-full">
      <WalletHealthScore score={score} error={error} isLoading={isLoading} />
      <WalletHealthDescription score={score} error={error} isLoading={isLoading} />
    </div>
  );
};

export default WalletHealth;
