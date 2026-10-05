'use client';

import type { ActionStatusCount } from '@revoke.cash/core/admin/health';
import type { ActionStatus } from '@revoke.cash/core/auto-revoke/actions';
import { getChainName } from '@revoke.cash/core/chains';
import { MINUTE } from '@revoke.cash/core/utils/time';
import Card, { CardTitle } from 'components/common/Card';
import Href from 'components/common/Href';
import TimeAgo from 'components/common/TimeAgo';
import { useAdminHealth } from 'lib/hooks/admin/useAdminOverview';
import { type ReactNode, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import DueIndexerScansPanel from './DueIndexerScansPanel';
import EvaluationBacklogPanel from './EvaluationBacklogPanel';
import FeeVerificationPanel from './FeeVerificationPanel';
import IndexerProblemsPanel from './IndexerProblemsPanel';
import RefundRequestsPanel from './refunds/RefundRequestsPanel';
import StuckPaymentsPanel from './StuckPaymentsPanel';

// blocked_budget is the gas budget working as designed, so only failures are a problem
const PROBLEM_ACTION_STATUSES: ActionStatus[] = ['failed'];

// The health query counts these completed statuses over the last 7 days only
const RECENT_ACTION_STATUSES: ActionStatus[] = ['succeeded', 'failed', 'skipped'];

// The scheduler enqueues due scans every minute and a finished or failed scan moves next_run_at forward, so a scan
// still due after this long means the scheduler or events worker has stopped
const INDEXER_SCAN_WARNING_AGE = 15 * MINUTE;

// Pending evaluations are enqueued every 30 seconds and a failed one is retried after 30 and 60 seconds, so a healthy
// evaluator clears a row within about 2 minutes
const EVALUATION_BACKLOG_WARNING_AGE = 5 * MINUTE;

// The reconcile cron scans every payment chain for incoming transfers every 5 minutes
const PAYMENT_SCAN_WARNING_AGE = 15 * MINUTE;

// The verification cron runs every 5 minutes, so the queue normally only holds a few dropped or mempool transactions,
// and about 1 reported fee transaction per day fails verification
const FEE_VERIFICATION_PENDING_WARNING_COUNT = 20;
const FEE_VERIFICATION_FAILED_WARNING_COUNT = 10;

// A missing timestamp means the reading never happened, which counts as too old
const isOlderThan = (timestamp: string | null, age: number) =>
  timestamp === null || Date.now() - new Date(timestamp).getTime() > age;

type HealthPanel =
  | 'indexer-due'
  | 'evaluation-backlog'
  | 'indexer-failing'
  | 'stuck-payments'
  | 'pending-refunds'
  | 'fee-verification-pending'
  | 'fee-verification-failed';

const HealthSection = () => {
  const { data, isLoading, error } = useAdminHealth();
  const [openPanel, setOpenPanel] = useState<HealthPanel | null>(null);

  const togglePanel = (panel: HealthPanel) => setOpenPanel((current) => (current === panel ? null : panel));

  return (
    <Card
      header={
        <CardTitle
          title="Pipeline health"
          subtitle="Auto-revoke, indexing, payment and batch fee backlogs across all users"
        />
      }
      isLoading={isLoading}
      error={error}
      className={twMerge(isLoading && 'h-40')}
    >
      {data && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <HealthTile
              label="Indexer scans due"
              value={
                data.oldestDueIndexerRunAt ? (
                  <>
                    oldest <TimeAgo datetime={data.oldestDueIndexerRunAt} live={false} />
                  </>
                ) : (
                  'none due'
                )
              }
              status={
                data.oldestDueIndexerRunAt !== null && isOlderThan(data.oldestDueIndexerRunAt, INDEXER_SCAN_WARNING_AGE)
                  ? 'warning'
                  : 'neutral'
              }
              isOpen={openPanel === 'indexer-due'}
              onClick={() => togglePanel('indexer-due')}
            />
            <HealthTile
              label="Evaluation backlog"
              value={data.evaluationBacklogCount}
              detail={
                data.evaluationBacklogOldestComputedAt && (
                  <>
                    oldest <TimeAgo datetime={data.evaluationBacklogOldestComputedAt} live={false} />
                  </>
                )
              }
              status={
                data.evaluationBacklogOldestComputedAt !== null &&
                isOlderThan(data.evaluationBacklogOldestComputedAt, EVALUATION_BACKLOG_WARNING_AGE)
                  ? 'warning'
                  : 'neutral'
              }
              isOpen={openPanel === 'evaluation-backlog'}
              onClick={() => togglePanel('evaluation-backlog')}
            />
            <HealthTile
              label="Payment scan"
              value={
                data.oldestPaymentScanCursor.updatedAt ? (
                  <TimeAgo datetime={data.oldestPaymentScanCursor.updatedAt} live={false} />
                ) : (
                  'never'
                )
              }
              detail={`Oldest chain: ${getChainName(data.oldestPaymentScanCursor.chainId)}`}
              status={
                isOlderThan(data.oldestPaymentScanCursor.updatedAt, PAYMENT_SCAN_WARNING_AGE) ? 'warning' : 'neutral'
              }
            />
            <HealthTile
              label="Stuck transactions"
              value={data.stuckSubmittedCount}
              status={data.stuckSubmittedCount > 0 ? 'danger' : 'neutral'}
              href="/admin/executor"
            />
            <HealthTile
              label="Wallets not upgraded"
              value={data.notUpgradedWalletCount}
              status={data.notUpgradedWalletCount > 0 ? 'warning' : 'neutral'}
              href="/admin/executor#wallets-not-upgraded"
            />
            <HealthTile
              label="Indexing failing"
              value={data.indexerFailingCount}
              status={data.indexerFailingCount > 0 ? 'warning' : 'neutral'}
              isOpen={openPanel === 'indexer-failing'}
              onClick={() => togglePanel('indexer-failing')}
            />
            <HealthTile
              label="Payments stuck pending"
              value={data.pendingPaymentsPastExpiryCount}
              status={data.pendingPaymentsPastExpiryCount > 0 ? 'warning' : 'neutral'}
              isOpen={openPanel === 'stuck-payments'}
              onClick={() => togglePanel('stuck-payments')}
            />
            <HealthTile
              label="Pending refunds"
              value={data.pendingRefundRequestCount}
              status={data.pendingRefundRequestCount > 0 ? 'warning' : 'neutral'}
              isOpen={openPanel === 'pending-refunds'}
              onClick={() => togglePanel('pending-refunds')}
            />
            <HealthTile
              label="Fee checks pending"
              value={data.feeVerificationPendingCount}
              status={data.feeVerificationPendingCount > FEE_VERIFICATION_PENDING_WARNING_COUNT ? 'warning' : 'neutral'}
              isOpen={openPanel === 'fee-verification-pending'}
              onClick={() => togglePanel('fee-verification-pending')}
            />
            <HealthTile
              label="Fee checks failed (7d)"
              value={data.feeVerificationFailedCount}
              status={data.feeVerificationFailedCount > FEE_VERIFICATION_FAILED_WARNING_COUNT ? 'warning' : 'neutral'}
              isOpen={openPanel === 'fee-verification-failed'}
              onClick={() => togglePanel('fee-verification-failed')}
            />
          </div>

          <DueIndexerScansPanel isOpen={openPanel === 'indexer-due'} />
          <EvaluationBacklogPanel isOpen={openPanel === 'evaluation-backlog'} />
          <IndexerProblemsPanel isOpen={openPanel === 'indexer-failing'} />
          <StuckPaymentsPanel isOpen={openPanel === 'stuck-payments'} />
          <RefundRequestsPanel isOpen={openPanel === 'pending-refunds'} />
          <FeeVerificationPanel kind="pending" isOpen={openPanel === 'fee-verification-pending'} />
          <FeeVerificationPanel kind="failed" isOpen={openPanel === 'fee-verification-failed'} />

          <div className="flex flex-wrap gap-2">
            {data.actionCounts.map((entry) => (
              <ActionStatusChip key={entry.status} entry={entry} />
            ))}
            {data.actionCounts.length === 0 && (
              <span className="text-sm text-zinc-500">No open or recent (7d) auto-revoke actions</span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

type HealthTileStatus = 'neutral' | 'warning' | 'danger';

const HEALTH_TILE_STATUS_CLASSES: Record<HealthTileStatus, string> = {
  neutral: '',
  warning: 'text-yellow-600 dark:text-yellow-400',
  danger: 'text-red-600 dark:text-red-400',
};

const HEALTH_TILE_CLASSES = 'flex flex-col items-start gap-1 rounded-lg p-2 -m-2 text-left';
const INTERACTIVE_HEALTH_TILE_CLASSES = 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800';

interface HealthTileProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  status: HealthTileStatus;
  // A tile either links to another page, opens a drill-down panel, or only shows its reading
  href?: string;
  isOpen?: boolean;
  onClick?: () => void;
}

const HealthTile = ({ label, value, detail, status, href, isOpen, onClick }: HealthTileProps) => {
  const content = (
    <>
      <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className={twMerge('text-2xl font-semibold', HEALTH_TILE_STATUS_CLASSES[status])}>{value}</span>
      {detail && <span className="text-xs text-zinc-500 dark:text-zinc-500">{detail}</span>}
    </>
  );

  if (href) {
    return (
      <Href
        href={href}
        router
        underline="none"
        className={twMerge(HEALTH_TILE_CLASSES, INTERACTIVE_HEALTH_TILE_CLASSES)}
      >
        {content}
      </Href>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isOpen}
        className={twMerge(
          HEALTH_TILE_CLASSES,
          INTERACTIVE_HEALTH_TILE_CLASSES,
          isOpen && 'bg-zinc-100 dark:bg-zinc-800',
        )}
      >
        {content}
      </button>
    );
  }

  return <div className={HEALTH_TILE_CLASSES}>{content}</div>;
};

const ActionStatusChip = ({ entry }: { entry: ActionStatusCount }) => (
  <Href
    href={`/admin/activity?status=${entry.status}`}
    router
    underline="none"
    className={twMerge(
      'rounded-md px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700',
      PROBLEM_ACTION_STATUSES.includes(entry.status) &&
        entry.count > 0 &&
        'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/50',
    )}
  >
    {entry.status}
    {RECENT_ACTION_STATUSES.includes(entry.status) && ' (7d)'}: {entry.count}
  </Href>
);

export default HealthSection;
