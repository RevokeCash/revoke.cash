'use client';

import type { ExecutorPipeline, ProblemAction } from '@revoke.cash/core/admin/executor';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminQuery } from 'lib/hooks/admin/useAdminQuery';
import ky from 'lib/ky';
import { toast } from 'react-toastify';

interface AdminExecutorPipelinesResponse {
  pipelines: ExecutorPipeline[];
  maxPendingPerChain: number;
}

interface AdminExecutorProblemsResponse {
  stuckSubmitted: ProblemAction[];
  deferred: ProblemAction[];
}

export const useAdminExecutorPipelines = () => {
  return useAdminQuery<AdminExecutorPipelinesResponse>(
    ['admin', 'executor', 'pipelines'],
    '/api/admin/executor/pipelines',
  );
};

export const useAdminExecutorProblems = () => {
  return useAdminQuery<AdminExecutorProblemsResponse>(
    ['admin', 'executor', 'problems'],
    '/api/admin/executor/problems',
  );
};

export const useAdminRetryAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (actionId: string) => ky.post(`/api/admin/actions/${actionId}/retry`).json<{ ok: boolean }>(),
    onSuccess: () => {
      toast.success('Action scheduled for immediate retry');
      queryClient.invalidateQueries({ queryKey: ['admin', 'executor'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'activity'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
    onError: (error) => {
      toast.error(parseErrorMessage(error) ?? 'Failed to retry action');
    },
  });
};
