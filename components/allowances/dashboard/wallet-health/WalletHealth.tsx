import { useQuery } from '@tanstack/react-query';
import { getNeftureRiskScore } from 'lib/utils/allowances';
import { Address } from 'viem';
import WalletHealthScore from './WalletHealthScore';
import WalletHealthDescription from './WalletHealthDescription';
import { ChainId } from '@revoke.cash/chains';

interface Props {
  address: Address;
  chainId: number;
}

const WalletHealth = ({ address, chainId }: Props) => {
  // TODO: Make the refreshing depend on new events (same events == same score)
  const {
    data: score = 0,
    isLoading,
    error,
  } = useQuery<number, Error>({
    queryKey: ['walletHealthScore', chainId, address],
    queryFn: () => getNeftureRiskScore(address),
    enabled: !!address && chainId === ChainId.EthereumMainnet,
  });

  if (chainId !== ChainId.EthereumMainnet) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <WalletHealthScore score={score} error={error} isLoading={isLoading} />
      <WalletHealthDescription score={score} error={error} isLoading={isLoading} />
    </div>
  );
};

export default WalletHealth;
