import type { TokenContract, TokenStandard } from 'lib/interfaces';
import type { PublicClient } from 'viem';

export interface PriceStrategy {
  supportedAssets: TokenStandard[];
  calculateNativeTokenPrice: (publicClient: PublicClient) => Promise<number>;
  calculateTokenPrice: (tokenContract: TokenContract) => Promise<number>;
}
