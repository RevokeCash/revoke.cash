import { deduplicateArray, isNullish } from 'lib/utils';
import type { TokenContract, TokenStandard } from 'lib/utils/tokens';
import type { PublicClient } from 'viem';
import type { PriceStrategy } from './PriceStrategy';

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
    this.supportedAssets = deduplicateArray(this.strategies.flatMap((strategy) => strategy.supportedAssets));
  }

  // Note: we only use the first strategy to calculate the native token price, so we only need to make sure that
  // the first strategy is able to calculate the native token price
  public async calculateNativeTokenPrice(publicClient: PublicClient): Promise<number | null> {
    if (this.strategies.length === 0) throw new Error('No strategies provided');
    return this.strategies[0].calculateNativeTokenPrice(publicClient);
  }

  public async calculateTokenPrice(tokenContract: TokenContract): Promise<number | null> {
    const supportedStrategies = this.getSupportedStrategies(tokenContract);
    if (supportedStrategies.length === 0) throw new Error('No supported strategies provided for this token type');

    if (this.aggregationType === AggregationType.ANY) {
      return await Promise.any(supportedStrategies.map((strategy) => strategy.calculateTokenPrice(tokenContract)));
    }

    if (this.aggregationType === AggregationType.AVERAGE) {
      const results = await Promise.all(
        supportedStrategies.map((strategy) => strategy.calculateTokenPrice(tokenContract)),
      );

      const validResults = results.filter((result) => !isNullish(result));

      const sum = validResults.reduce((acc, curr) => acc + curr, 0);
      return sum / validResults.length;
    }

    if (this.aggregationType === AggregationType.MAX) {
      const results = await Promise.all(
        supportedStrategies.map((strategy) => strategy.calculateTokenPrice(tokenContract)),
      );
      const validResults = results.filter((result) => !isNullish(result));
      return Math.max(...validResults);
    }

    throw new Error('Invalid aggregation type');
  }

  public getSupportedStrategies(tokenContract: TokenContract): PriceStrategy[] {
    return this.strategies.filter((strategy) => strategy.supportedAssets.includes(tokenContract.tokenStandard));
  }
}
