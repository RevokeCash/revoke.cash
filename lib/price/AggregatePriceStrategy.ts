import { TokenContract } from 'lib/interfaces';
import { bigintMax } from 'lib/utils/math';
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

  constructor(options: AggregatePriceStrategyOptions) {
    this.aggregationType = options.aggregationType;
    this.strategies = options.strategies;
  }

  // Note: we only use the first strategy to calculate the native token price, so we only need to make sure that
  // the first strategy is able to calculate the native token price
  public async calculateNativeTokenPrice(publicClient: PublicClient): Promise<number> {
    if (this.strategies.length === 0) throw new Error('No strategies provided');
    return this.strategies.at(0).calculateNativeTokenPrice(publicClient);
  }

  public async calculateInversePrice(tokenContract: TokenContract): Promise<bigint> {
    if (this.strategies.length === 0) throw new Error('No strategies provided');

    if (this.aggregationType === AggregationType.ANY) {
      return await Promise.any(this.strategies.map((strategy) => strategy.calculateInversePrice(tokenContract)));
    }

    if (this.aggregationType === AggregationType.AVERAGE) {
      const results = await Promise.all(
        this.strategies.map((strategy) => strategy.calculateInversePrice(tokenContract)),
      );
      const sum = results.reduce((acc, curr) => acc + curr, 0n);
      return sum / BigInt(results.length);
    }

    if (this.aggregationType === AggregationType.MAX) {
      const results = await Promise.all(
        this.strategies.map((strategy) => strategy.calculateInversePrice(tokenContract)),
      );
      return bigintMax(...results);
    }
  }
}
