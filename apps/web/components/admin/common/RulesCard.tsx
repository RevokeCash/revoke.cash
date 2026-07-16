'use client';

import type { AutoRevokeRules, RulesSource } from '@revoke.cash/core/auto-revoke/evaluation/rules';
import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import Button from 'components/common/Button';
import Card, { CardTitle } from 'components/common/Card';
import StatusLabel from 'components/common/StatusLabel';
import { twMerge } from 'tailwind-merge';

interface Props {
  rules?: AutoRevokeRules;
  source?: RulesSource;
  isLoading?: boolean;
}

const RISK_SENSITIVITY_LABELS: Record<string, string> = {
  exploits_only: 'Exploits only',
  high: 'High risk',
  medium: 'Medium risk',
};

const RulesCard = ({ rules, source, isLoading }: Props) => {
  const subtitle = source
    ? 'Effective auto-revoke rules and where they come from'
    : 'Evaluation rules applied to the covered addresses';

  return (
    <Card
      header={<CardTitle title="Rules" subtitle={subtitle} />}
      isLoading={isLoading}
      className={twMerge(isLoading && 'h-40')}
    >
      {rules && (
        <div className="flex flex-col gap-4">
          {source && <RulesSourceLine source={source} />}

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <RuleField label="Risk detection" enabled={rules.riskDetectionEnabled} />
            <div className="flex flex-col gap-1">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Risk sensitivity</span>
              <span>{RISK_SENSITIVITY_LABELS[rules.riskSensitivity] ?? rules.riskSensitivity}</span>
            </div>
            <RuleField
              label="Stale approvals"
              enabled={rules.staleApprovalEnabled}
              detail={rules.staleApprovalEnabled ? `after ${rules.staleApprovalThresholdDays} days` : undefined}
            />
          </div>
        </div>
      )}
    </Card>
  );
};

const RulesSourceLine = ({ source }: { source: RulesSource }) => {
  if (source.type === 'custom') {
    return <span className="text-sm text-zinc-600 dark:text-zinc-400">Source: custom per-address rules</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        Source: subscription rules from {source.planName} owned by {shortenAddress(source.ownerAddress, 6)}
      </span>
      <Button style="secondary" size="sm" href={`/admin/subscriptions/${source.subscriptionId}`} router>
        View subscription
      </Button>
    </div>
  );
};

interface RuleFieldProps {
  label: string;
  enabled: boolean;
  detail?: string;
}

const RuleField = ({ label, enabled, detail }: RuleFieldProps) => (
  <div className="flex flex-col gap-1">
    <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
    <div className="flex items-center gap-2">
      <StatusLabel status={enabled ? 'success' : 'neutral'} className="py-0.75">
        {enabled ? 'Enabled' : 'Disabled'}
      </StatusLabel>
      {detail && <span className="text-sm text-zinc-600 dark:text-zinc-400">{detail}</span>}
    </div>
  </div>
);

export default RulesCard;
