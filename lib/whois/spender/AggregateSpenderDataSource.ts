import type { Nullable, SpenderData, SpenderRiskData } from 'lib/interfaces';
import { assertFulfilled, deduplicateArray } from 'lib/utils';
import type { Address } from 'viem';
import type { SpenderDataSource } from './SpenderDataSource';

export enum AggregationType {
  SEQUENTIAL_FIRST = 'SEQUENTIAL_FIRST',
  PARALLEL_COMBINED = 'PARALLEL_COMBINED',
}

export interface AggregateSpenderDataSourceOptions {
  aggregationType: AggregationType;
  sources: SpenderDataSource[];
}

export class AggregateSpenderDataSource implements SpenderDataSource {
  aggregationType: AggregationType;
  sources: SpenderDataSource[];

  constructor(options: AggregateSpenderDataSourceOptions) {
    this.aggregationType = options.aggregationType;
    this.sources = options.sources;
  }

  async getSpenderData(address: Address, chainId: number): Promise<Nullable<SpenderData | SpenderRiskData>> {
    if (this.aggregationType === AggregationType.SEQUENTIAL_FIRST) {
      for (const source of this.sources) {
        const result = await source.getSpenderData(address, chainId);
        if (result) return result;
      }
      return null;
    }

    if (this.aggregationType === AggregationType.PARALLEL_COMBINED) {
      const settlements = await Promise.allSettled(
        this.sources.map((source) => source.getSpenderData(address, chainId)),
      );
      const results = settlements.filter(assertFulfilled).map((result) => result.value);

      const aggregatedResults = results.reduce<SpenderData | SpenderRiskData>(
        (acc, result) =>
          result
            ? { ...acc, ...(result ?? {}), riskFactors: [...(acc?.riskFactors ?? []), ...(result?.riskFactors ?? [])] }
            : acc,
        {},
      );

      aggregatedResults.riskFactors = deduplicateArray(
        aggregatedResults.riskFactors ?? [],
        (a, b) => a.type === b.type && a.data === b.data && a.source === b.source,
      );

      return aggregatedResults;
    }

    throw new Error('Invalid aggregation type');
  }
}
