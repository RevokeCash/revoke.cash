import { TokenContract, TokenStandard } from 'lib/interfaces';
import { deduplicateArray } from 'lib/utils';
import { bigintMax } from 'lib/utils/math';
import { isErc721Contract } from 'lib/utils/tokens';
import { PublicClient } from 'viem';
import { PriceStrategy } from './PriceStrategy';

export enum AggregationType {
  ANY = 'ANY',
  AVERAGE = 'AVERAGE',
  MAX = 'MAX',
}

export interface AggregatePriceStrategyOptions {
  aggregationType: AggregationType;
  strategies: PriceStrategy[];
}

export class AggregatePriceStrategy implements PriceStrategy {
  aggregationType: AggregationType;
  strategies: PriceStrategy[];
  supportedAssets: TokenStandard[];

  constructor(options: AggregatePriceStrategyOptions) {
    this.aggregationType = options.aggregationType;
    this.strategies = options.strategies;
    this.supportedAssets = deduplicateArray(
      this.strategies.reduce<TokenStandard[]>((acc, curr) => {
        return [...acc, ...curr.supportedAssets];
      }, []),
    );
  }

  // Note: we only use the first strategy to calculate the native token price, so we only need to make sure that
  // the first strategy is able to calculate the native token price
  public async calculateNativeTokenPrice(publicClient: PublicClient): Promise<number> {
    if (this.strategies.length === 0) throw new Error('No strategies provided');
    return this.strategies.at(0).calculateNativeTokenPrice(publicClient);
  }

  public async calculateInversePrice(tokenContract: TokenContract): Promise<bigint> {
    const supportedStrategies = this.getSupportedStrategies(tokenContract);
    if (supportedStrategies.length === 0) throw new Error('No supported strategies provided for this token type');

    if (this.aggregationType === AggregationType.ANY) {
      return await Promise.any(supportedStrategies.map((strategy) => strategy.calculateInversePrice(tokenContract)));
    }

    if (this.aggregationType === AggregationType.AVERAGE) {
      const results = await Promise.all(
        supportedStrategies.map((strategy) => strategy.calculateInversePrice(tokenContract)),
      );
      const sum = results.reduce((acc, curr) => acc + curr, 0n);
      return sum / BigInt(results.length);
    }

    // TODO: This is probably bugged, since it's an inverse price - so we need to get the minimum inverse price
    if (this.aggregationType === AggregationType.MAX) {
      const results = await Promise.all(
        supportedStrategies.map((strategy) => strategy.calculateInversePrice(tokenContract)),
      );
      return bigintMax(...results);
    }
  }

  public getSupportedStrategies(tokenContract: TokenContract): PriceStrategy[] {
    if (isErc721Contract(tokenContract)) {
      return this.strategies.filter((strategy) => strategy.supportedAssets.includes('ERC721'));
    }

    return this.strategies.filter((strategy) => strategy.supportedAssets.includes('ERC20'));
  }
}
