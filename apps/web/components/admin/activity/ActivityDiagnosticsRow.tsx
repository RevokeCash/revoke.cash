import type { AdminActivityItem } from '@revoke.cash/core/admin/activity';
import Href from 'components/common/Href';

const TABLE_COLUMN_COUNT = 12;

interface Props {
  item: AdminActivityItem;
}

const ActivityDiagnosticsRow = ({ item }: Props) => (
  <tr className="border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
    <td colSpan={TABLE_COLUMN_COUNT} className="px-2 py-3">
      <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs">
        <DiagnosticsField label="Action ID" value={item.id} mono />
        <DiagnosticsField label="Nonce" value={item.nonce !== null ? String(item.nonce) : '-'} mono />
        <DiagnosticsField label="Signer" value={item.signerAddress ?? '-'} mono />
        <DiagnosticsField label="Estimated cost" value={formatDiagnosticsCost(item.estimatedCostUsd)} />
        <DiagnosticsField label="Final cost" value={formatDiagnosticsCost(item.costUsd)} />
        <DiagnosticsField label="Created" value={formatDiagnosticsDate(item.createdAt)} />
        <DiagnosticsField label="Submitted" value={formatDiagnosticsDate(item.submittedAt)} />
        <DiagnosticsField label="Completed" value={formatDiagnosticsDate(item.completedAt)} />
        <DiagnosticsField label="Next retry" value={formatDiagnosticsDate(item.nextRetryAt)} />
        <DiagnosticsField label="Cost deferred" value={formatDiagnosticsDate(item.costDeferredAt)} />
        <div className="flex flex-col gap-0.5">
          <span className="text-zinc-500 dark:text-zinc-400">Billed subscription</span>
          {item.billedSubscriptionId ? (
            <Href
              href={`/admin/subscriptions/${item.billedSubscriptionId}`}
              router
              underline="always"
              className="font-mono"
            >
              {item.billedSubscriptionId}
            </Href>
          ) : (
            <span>-</span>
          )}
        </div>
      </div>
    </td>
  </tr>
);

interface DiagnosticsFieldProps {
  label: string;
  value: string;
  mono?: boolean;
}

const DiagnosticsField = ({ label, value, mono }: DiagnosticsFieldProps) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
    <span className={mono ? 'font-mono' : undefined}>{value}</span>
  </div>
);

const formatDiagnosticsCost = (costUsd: number | null): string => {
  return costUsd === null ? '-' : `$${costUsd.toFixed(4)}`;
};

const formatDiagnosticsDate = (isoDate: string | null): string => {
  return isoDate === null ? '-' : new Date(isoDate).toLocaleString();
};

export default ActivityDiagnosticsRow;
