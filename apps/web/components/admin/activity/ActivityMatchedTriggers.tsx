import type { MatchedTrigger } from '@revoke.cash/core/auto-revoke/evaluation/rules';
import type { RiskFactor } from '@revoke.cash/core/risk';
import AutoRevokeActivityTriggerBadge from 'components/account/auto-revoke/activity/AutoRevokeActivityTriggerBadge';

interface Props {
  matchedTriggers: MatchedTrigger[];
}

const ActivityMatchedTriggers = ({ matchedTriggers }: Props) => (
  <div className="flex flex-col gap-1">
    {matchedTriggers.map((trigger) => (
      <div key={trigger.type} className="flex items-center gap-2">
        <AutoRevokeActivityTriggerBadge triggerType={trigger.type} />
        {trigger.riskFactors && trigger.riskFactors.length > 0 && (
          <span className="font-mono">
            {trigger.riskFactors.map((riskFactor) => formatRiskFactor(riskFactor)).join(', ')}
          </span>
        )}
      </div>
    ))}
  </div>
);

// Exploit risk factors carry the exploit name as their data
const formatRiskFactor = (riskFactor: RiskFactor): string => {
  const typeWithData = riskFactor.data ? `${riskFactor.type}: ${riskFactor.data}` : riskFactor.type;
  return `${typeWithData} (${riskFactor.source})`;
};

export default ActivityMatchedTriggers;
