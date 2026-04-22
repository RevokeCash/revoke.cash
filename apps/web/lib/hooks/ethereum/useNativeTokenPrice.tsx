import { useQuery } from '@tanstack/react-query';
import { getNativeTokenPrice } from 'lib/price/utils';
import { getChainName } from 'lib/utils/chains';

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
