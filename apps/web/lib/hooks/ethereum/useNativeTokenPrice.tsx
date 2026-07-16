import { getChainName } from '@revoke.cash/core/chains';
import { useQuery } from '@tanstack/react-query';
import { getNativeTokenPrice } from 'lib/price';

export const useNativeTokenPrice = (chainId: number) => {
  const { data: nativeTokenPrice, isLoading } = useQuery({
    queryKey: ['nativeTokenPrice', chainId],
    queryFn: async () => {
      const price = await getNativeTokenPrice(chainId);
      console.log(`${getChainName(chainId)}: Native token price = ${price}`);
      return price;
    },
  });

  return { nativeTokenPrice, isLoading };
};
