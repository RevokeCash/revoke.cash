'use client';

import type { ActionStatusCount } from '@revoke.cash/core/admin/health';
import Card, { CardTitle } from 'components/common/Card';
import Href from 'components/common/Href';
import { useAdminHealth } from 'lib/hooks/admin/useAdminOverview';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import EvaluationBacklogPanel from './EvaluationBacklogPanel';
import IndexerProblemsPanel from './IndexerProblemsPanel';
import StuckPaymentsPanel from './StuckPaymentsPanel';

const PROBLEM_ACTION_STATUSES = ['failed', 'blocked_budget'];

type HealthPanel = 'evaluation-backlog' | 'indexer-disabled' | 'indexer-failing' | 'stuck-payments';

const HealthSection = () => {
  const { data, isLoading } = useAdminHealth();
  const [openPanel, setOpenPanel] = useState<HealthPanel | null>(null);

  const togglePanel = (panel: HealthPanel) => setOpenPanel((current) => (current === panel ? null : panel));

  return (
    <Card
      header={<CardTitle title="Pipeline health" subtitle="Auto-revoke and indexing backlogs across all users" />}
      isLoading={isLoading}
      className={twMerge(isLoading && 'h-40')}
    >
      {data && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <HealthTile
              label="Evaluation backlog"
              count={data.evaluationBacklogCount}
              warnAbove={100}
              isOpen={openPanel === 'evaluation-backlog'}
              onClick={() => togglePanel('evaluation-backlog')}
            />
            <HealthTile
              label="Indexer rows disabled"
              count={data.indexerDisabledCount}
              warnAbove={0}
              isOpen={openPanel === 'indexer-disabled'}
              onClick={() => togglePanel('indexer-disabled')}
            />
            <HealthTile
              label="Indexer rows failing"
              count={data.indexerFailingCount}
              warnAbove={25}
              isOpen={openPanel === 'indexer-failing'}
              onClick={() => togglePanel('indexer-failing')}
            />
            <HealthTile
              label="Payments stuck pending"
              count={data.pendingPaymentsPastExpiryCount}
              warnAbove={0}
              isOpen={openPanel === 'stuck-payments'}
              onClick={() => togglePanel('stuck-payments')}
            />
          </div>

          <EvaluationBacklogPanel isOpen={openPanel === 'evaluation-backlog'} />
          <IndexerProblemsPanel kind="disabled" isOpen={openPanel === 'indexer-disabled'} />
          <IndexerProblemsPanel kind="failing" isOpen={openPanel === 'indexer-failing'} />
          <StuckPaymentsPanel isOpen={openPanel === 'stuck-payments'} />

          <div className="flex flex-wrap gap-2">
            {data.actionCounts.map((entry) => (
              <ActionStatusChip key={entry.status} entry={entry} />
            ))}
            {data.actionCounts.length === 0 && (
              <span className="text-sm text-zinc-500">No auto-revoke actions recorded yet</span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

interface HealthTileProps {
  label: string;
  count: number;
  warnAbove: number;
  isOpen: boolean;
  onClick: () => void;
}

const HealthTile = ({ label, count, warnAbove, isOpen, onClick }: HealthTileProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={isOpen}
    className={twMerge(
      'flex flex-col items-start gap-1 rounded-lg p-2 -m-2 text-left cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800',
      isOpen && 'bg-zinc-100 dark:bg-zinc-800',
    )}
  >
    <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
    <span className={twMerge('text-2xl font-semibold', count > warnAbove && 'text-yellow-600 dark:text-yellow-400')}>
      {count}
    </span>
  </button>
);

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
    {entry.status}: {entry.count}
  </Href>
);

export default HealthSection;
