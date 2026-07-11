import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { hashKey, type QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

interface Params<TVariables, TData, TCached> {
  queryKey: QueryKey;
  mutationFn: (variables: TVariables) => Promise<TData>;
  applyOptimisticUpdate: (previous: TCached, variables: TVariables) => TCached;
  errorMessage: string;
}

/**
 * Wraps `useMutation` with the optimistic-update + rollback pattern:
 * - `onMutate` cancels in-flight refetches, snapshots the cached value,
 *   and applies `applyOptimisticUpdate` to the cache
 * - the mutation scope serializes the requests: the optimistic update still applies immediately,
 *   but each request waits for the previous one, so rapid edits cannot land out of order and an
 *   older response can never overwrite a newer value
 * - `onError` restores the snapshot and shows a toast with `errorMessage`
 * - once the last mutation of a burst settles, the query is invalidated so the server's
 *   authoritative value refetches
 */
export const useOptimisticMutation = <TVariables, TData, TCached>({
  queryKey,
  mutationFn,
  applyOptimisticUpdate,
  errorMessage,
}: Params<TVariables, TData, TCached>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    mutationKey: queryKey,
    scope: { id: hashKey(queryKey) },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TCached>(queryKey);
      if (previous) {
        queryClient.setQueryData(queryKey, applyOptimisticUpdate(previous, variables));
      }
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(parseErrorMessage(error) || errorMessage);
    },
    onSettled: () => {
      // Skip intermediate refetches while more edits of the same burst are still in flight
      if (queryClient.isMutating({ mutationKey: queryKey }) === 1) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });
};
