import { TokenContract, TokenStandard } from 'lib/interfaces';
import { PublicClient } from 'viem';

export interface PriceStrategy {
  supportedAssets: TokenStandard[];
  calculateNativeTokenPrice: (publicClient: PublicClient) => Promise<number>;
  calculateInversePrice: (tokenContract: TokenContract) => Promise<bigint>;
}
