import { MINUTE } from '../utils/time';
import { StillIndexingError } from './errors';

export const INDEXER_WARM_THRESHOLD = 100_000;
const INDEXER_STALLED_THRESHOLD = 90 * MINUTE;

interface IndexerBlockRangeParams {
  lastToBlock: number;
  headBlock: number;
}

interface IndexerProgressParams extends IndexerBlockRangeParams {
  lastScanAt: Date;
}

export const assertIndexerIsNotTooFarBehind = ({ lastToBlock, headBlock }: IndexerBlockRangeParams): void => {
  if (indexerIsTooFarBehind({ lastToBlock, headBlock })) {
    throw new StillIndexingError(lastToBlock, headBlock);
  }
};

export const assertIndexerIsNotActivelyIndexing = ({
  lastToBlock,
  headBlock,
  lastScanAt,
}: IndexerProgressParams): void => {
  if (indexerIsTooFarBehind({ lastToBlock, headBlock }) && !indexerHasStalled(lastScanAt)) {
    throw new StillIndexingError(lastToBlock, headBlock);
  }
};

export const indexerHasStalled = (lastScanAt: Date): boolean => {
  return lastScanAt.getTime() < Date.now() - INDEXER_STALLED_THRESHOLD;
};

export const indexerIsTooFarBehind = ({ lastToBlock, headBlock }: IndexerBlockRangeParams): boolean => {
  const blocksRemaining = headBlock - lastToBlock;
  return blocksRemaining > INDEXER_WARM_THRESHOLD;
};
