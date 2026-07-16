import { MINUTE } from '../utils/time';
import { StillIndexingError } from './errors';

export const INDEXER_WARM_THRESHOLD = 100_000;
const INDEXER_STALLED_THRESHOLD = 90 * MINUTE;

interface IndexerBlockRangeParams {
  lastToBlock: number;
  headBlock: number;
  maxBlockRange?: number | null;
}

interface IndexerProgressParams extends IndexerBlockRangeParams {
  lastScanAt: Date;
}

export const assertIndexerIsNotTooFarBehind = (params: IndexerBlockRangeParams): void => {
  if (indexerIsTooFarBehind(params)) {
    throw new StillIndexingError(params.lastToBlock, params.headBlock);
  }
};

export const assertIndexerIsNotActivelyIndexing = ({
  lastToBlock,
  headBlock,
  maxBlockRange,
  lastScanAt,
}: IndexerProgressParams): void => {
  if (indexerIsTooFarBehind({ lastToBlock, headBlock, maxBlockRange }) && !indexerHasStalled(lastScanAt)) {
    throw new StillIndexingError(lastToBlock, headBlock);
  }
};

export const indexerHasStalled = (lastScanAt: Date): boolean => {
  return lastScanAt.getTime() < Date.now() - INDEXER_STALLED_THRESHOLD;
};

export const indexerIsTooFarBehind = ({ lastToBlock, headBlock, maxBlockRange }: IndexerBlockRangeParams): boolean => {
  const blocksRemaining = headBlock - lastToBlock;
  return blocksRemaining > getIndexerWarmThreshold(maxBlockRange);
};

export const getIndexerWarmThreshold = (maxBlockRange?: number | null): number => {
  return Math.min(INDEXER_WARM_THRESHOLD, maxBlockRange ?? INDEXER_WARM_THRESHOLD);
};
