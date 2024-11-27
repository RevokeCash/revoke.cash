import type { TokenContract, TokenStandard } from 'lib/interfaces';
import { deduplicateArray } from 'lib/utils';
import { isErc721Contract } from 'lib/utils/tokens';
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

  public async calculateTokenPrice(tokenContract: TokenContract): Promise<number> {
    const supportedStrategies = this.getSupportedStrategies(tokenContract);
    if (supportedStrategies.length === 0) throw new Error('No supported strategies provided for this token type');

    if (this.aggregationType === AggregationType.ANY) {
      return await Promise.any(supportedStrategies.map((strategy) => strategy.calculateTokenPrice(tokenContract)));
    }

    if (this.aggregationType === AggregationType.AVERAGE) {
      const results = await Promise.all(
        supportedStrategies.map((strategy) => strategy.calculateTokenPrice(tokenContract)),
      );

      const sum = results.reduce((acc, curr) => acc + curr, 0);
      return sum / results.length;
    }

    if (this.aggregationType === AggregationType.MAX) {
      const results = await Promise.all(
        supportedStrategies.map((strategy) => strategy.calculateTokenPrice(tokenContract)),
      );
      return Math.max(...results);
    }
  }

  public getSupportedStrategies(tokenContract: TokenContract): PriceStrategy[] {
    if (isErc721Contract(tokenContract)) {
      return this.strategies.filter((strategy) => strategy.supportedAssets.includes('ERC721'));
    }

    return this.strategies.filter((strategy) => strategy.supportedAssets.includes('ERC20'));
  }
}
