import type { PremiumPlanTier } from '@revoke.cash/core/premium/plans';
import StatusLabel from 'components/common/StatusLabel';

interface Props {
  planName: string;
  tier: PremiumPlanTier;
}

// Plans named after their tier (e.g. plan 'Ultimate' with tier 'ultimate') would show the same
// word twice, so only the badge is rendered in that case
const SubscriptionPlanLabel = ({ planName, tier }: Props) => {
  const badge = (
    <StatusLabel status={tier === 'ultimate' ? 'info' : 'neutral'} className="py-0.75">
      {tier === 'ultimate' ? 'Ultimate' : 'Premium'}
    </StatusLabel>
  );

  const planNameMatchesTier = planName.toLowerCase() === tier.toLowerCase();
  if (planNameMatchesTier) return badge;

  return (
    <div className="flex items-center gap-2">
      <span>{planName}</span>
      {badge}
    </div>
  );
};

export default SubscriptionPlanLabel;
