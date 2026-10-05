import type { AdminActivityItem } from '@revoke.cash/core/admin/activity';
import TimeAgoCell from 'components/admin/common/TimeAgoCell';
import CopyButton from 'components/common/CopyButton';
import Href from 'components/common/Href';
import { formatUsd } from 'lib/admin/format';
import type { ReactNode } from 'react';
import ActivityMatchedTriggers from './ActivityMatchedTriggers';

const TABLE_COLUMN_COUNT = 12;

interface Props {
  item: AdminActivityItem;
}

const ActivityDiagnosticsRow = ({ item }: Props) => {
  const rulesSubscriptionId = item.rulesSource.type === 'subscription' ? item.rulesSource.subscriptionId : null;

  return (
    <tr className="border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
      <td colSpan={TABLE_COLUMN_COUNT} className="px-2 py-3">
        <div className="flex flex-col gap-4 text-xs">
          <DiagnosticsSection title="Why">
            <DiagnosticsField
              label="Triggers"
              value={<ActivityMatchedTriggers matchedTriggers={item.matchedTriggers} />}
            />
            <DiagnosticsField
              label="Risk rule"
              value={item.rules.riskDetectionEnabled ? item.rules.riskSensitivity : 'off'}
              mono
            />
            <DiagnosticsField
              label="Stale rule"
              value={item.rules.staleApprovalEnabled ? `after ${item.rules.staleApprovalThresholdDays} days` : 'off'}
            />
            <DiagnosticsField
              label="Rules source"
              value={rulesSubscriptionId ?? 'custom'}
              href={formatSubscriptionHref(rulesSubscriptionId)}
              mono
            />
            <DiagnosticsField label="Approval updated" value={<TimeAgoCell timestamp={item.approvalLastUpdatedAt} />} />
          </DiagnosticsSection>
          <DiagnosticsSection title="Value">
            <DiagnosticsField
              label="Value at risk"
              value={item.valueAtRiskUsd === null ? '-' : formatUsd(item.valueAtRiskUsd)}
            />
            <DiagnosticsField label="Holds token" value={formatHoldsToken(item.holdsToken)} />
            <DiagnosticsField label="Spender risk score" value={String(item.spenderRiskScore)} />
          </DiagnosticsSection>
          <DiagnosticsSection title="Execution">
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
            <DiagnosticsField
              label="Billed subscription"
              value={item.billedSubscriptionId ?? '-'}
              href={formatSubscriptionHref(item.billedSubscriptionId)}
              mono
            />
          </DiagnosticsSection>
          {item.errorDetail && (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 dark:text-zinc-400">Error detail</span>
                <CopyButton content={item.errorDetail} className="text-zinc-500 dark:text-zinc-400" />
              </div>
              <pre className="font-mono whitespace-pre-wrap break-all">{item.errorDetail}</pre>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

interface DiagnosticsSectionProps {
  title: string;
  children: ReactNode;
}

const DiagnosticsSection = ({ title, children }: DiagnosticsSectionProps) => (
  <div className="flex flex-col gap-2">
    <span className="font-semibold">{title}</span>
    <div className="flex flex-wrap gap-x-8 gap-y-2">{children}</div>
  </div>
);

interface DiagnosticsFieldProps {
  label: string;
  value: ReactNode;
  href?: string;
  mono?: boolean;
}

const DiagnosticsField = ({ label, value, href, mono }: DiagnosticsFieldProps) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
    {href ? (
      <Href href={href} router underline="always" className={mono ? 'font-mono' : undefined}>
        {value}
      </Href>
    ) : (
      <div className={mono ? 'font-mono' : undefined}>{value}</div>
    )}
  </div>
);

const formatSubscriptionHref = (subscriptionId: string | null): string | undefined => {
  return subscriptionId === null ? undefined : `/admin/subscriptions/${subscriptionId}`;
};

const formatHoldsToken = (holdsToken: boolean | null): string => {
  if (holdsToken === null) return 'unknown';
  return holdsToken ? 'yes' : 'no';
};

const formatDiagnosticsCost = (costUsd: number | null): string => {
  return costUsd === null ? '-' : `$${costUsd.toFixed(4)}`;
};

const formatDiagnosticsDate = (isoDate: string | null): string => {
  return isoDate === null ? '-' : new Date(isoDate).toLocaleString();
};

export default ActivityDiagnosticsRow;
