import { TokenContract } from 'lib/interfaces';
import { PublicClient } from 'viem';

export interface PriceStrategy {
  calculateNativeTokenPrice: (publicClient: PublicClient) => Promise<number>;
  calculateInversePrice: (tokenContract: TokenContract) => Promise<bigint>;
}
