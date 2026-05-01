export const TIMESTAMPS_QUEUE_NAME = 'monitor_timestamps';

export interface TimestampsJobData {
  chainId: number;
}

export const TIMESTAMPS_DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 30_000 },
  removeOnComplete: true,
  removeOnFail: true,
};
