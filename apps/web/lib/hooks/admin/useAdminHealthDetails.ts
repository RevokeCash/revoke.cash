'use client';

import type {
  DueIndexerScanRow,
  EvaluationBacklogRow,
  FeeVerificationProblemKind,
  FeeVerificationProblemRow,
  IndexerProblemGroup,
  StuckPendingPaymentRow,
} from '@revoke.cash/core/admin/health';
import { useAdminQuery } from 'lib/hooks/admin/useAdminQuery';

export const useAdminEvaluationBacklog = (enabled: boolean) => {
  return useAdminQuery<EvaluationBacklogRow[]>(
    ['admin', 'health', 'evaluation-backlog'],
    '/api/admin/health/evaluation-backlog',
    { enabled },
  );
};

export const useAdminDueIndexerScans = (enabled: boolean) => {
  return useAdminQuery<DueIndexerScanRow[]>(['admin', 'health', 'indexer-due'], '/api/admin/health/indexer-due', {
    enabled,
  });
};

export const useAdminIndexerProblems = (enabled: boolean) => {
  return useAdminQuery<IndexerProblemGroup[]>(
    ['admin', 'health', 'indexer-problems'],
    '/api/admin/health/indexer-problems',
    { enabled },
  );
};

export const useAdminStuckPayments = (enabled: boolean) => {
  return useAdminQuery<StuckPendingPaymentRow[]>(
    ['admin', 'health', 'stuck-payments'],
    '/api/admin/health/stuck-payments',
    { enabled },
  );
};

export const useAdminFeeVerificationRows = (kind: FeeVerificationProblemKind, enabled: boolean) => {
  return useAdminQuery<FeeVerificationProblemRow[]>(
    ['admin', 'health', 'fee-verification', kind],
    '/api/admin/health/fee-verification',
    { searchParams: { kind }, enabled },
  );
};
