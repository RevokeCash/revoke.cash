export const timestampsQueueNameForChain = (chainId: number): string => `monitor_timestamps_${chainId}`;

export const TIMESTAMPS_DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 30_000 },
  removeOnComplete: true,
  removeOnFail: true,
};
