import { SpenderData, SpenderRiskData } from 'lib/interfaces';
import { deduplicateArray } from 'lib/utils';
import { Address } from 'viem';
import { SpenderDataSource } from './SpenderDataSource';

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

  async getSpenderData(address: Address, chainId: number): Promise<SpenderData | SpenderRiskData | null> {
    if (this.aggregationType === AggregationType.SEQUENTIAL_FIRST) {
      for (const source of this.sources) {
        const result = await source.getSpenderData(address, chainId);
        if (result) return result;
      }
      return null;
    }

    if (this.aggregationType === AggregationType.PARALLEL_COMBINED) {
      const results = await Promise.all(this.sources.map((source) => source.getSpenderData(address, chainId)));

      const aggregatedResults = results.reduce(
        (acc, result) =>
          result
            ? { ...acc, ...(result ?? {}), riskFactors: [...(acc?.riskFactors ?? []), ...(result?.riskFactors ?? [])] }
            : acc,
        {},
      );

      aggregatedResults.riskFactors = deduplicateArray(aggregatedResults.riskFactors);

      return aggregatedResults;
    }
  }
}
