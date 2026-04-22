export interface CombinedQueryResult<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
}

export const combineQueryResults = <T>(results: CombinedQueryResult<T>[]): CombinedQueryResult<T>[] =>
  results.map((result) => ({
    data: result.data,
    error: result.error,
    isLoading: result.isLoading,
    isSuccess: result.isSuccess,
  }));
