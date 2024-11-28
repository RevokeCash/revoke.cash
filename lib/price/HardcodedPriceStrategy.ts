import { TokenContract, TokenStandard } from 'lib/utils/tokens';
import { Address, PublicClient } from 'viem';
import { PriceStrategy } from './PriceStrategy';

export interface HardcodedPriceStrategyOptions {
  tokens: Array<Address | TokenPriceDetails>;
}

export interface TokenPriceDetails {
  address: Address;
  price: number;
  decimals: number;
}

export class HardcodedPriceStrategy implements PriceStrategy {
  tokens: Array<TokenPriceDetails>;
  supportedAssets: TokenStandard[] = ['ERC20'];

  constructor(options: HardcodedPriceStrategyOptions) {
    this.tokens = (options.tokens ?? []).map((token) =>
      typeof token === 'string' ? { address: token, price: 1, decimals: 18 } : token,
    );
  }

  public async calculateNativeTokenPrice(publicClient: PublicClient): Promise<number> {
    throw new Error('Cannot calculate native token price for HardcodedPriceStrategy');
  }

  public async calculateTokenPrice(tokenContract: TokenContract): Promise<number> {
    const tokenPriceDetails = this.tokens.find((token) => token.address === tokenContract.address);
    if (!tokenPriceDetails) throw new Error('Not included in hardcoded token prices');

    // return parseUnits(String(1 / tokenPriceDetails.price), tokenPriceDetails.decimals);

    return tokenPriceDetails.price;
  }
}
