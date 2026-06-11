export const TIMESTAMPS_QUEUE_NAME = 'indexer_timestamps';

export const timestampsJobId = (chainId: number): string => `index-timestamps-${chainId}`;

export interface TimestampsJobData {
  chainId: number;
}
