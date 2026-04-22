import Label from 'components/common/Label';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import type { Session } from 'lib/utils/sessions';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props {
  policyType: 'Transfers' | 'Calls' | 'All' | 'None';
  session: Session;
}

const PolicyTypeCell = ({ policyType, session }: Props) => {
  const t = useTranslations();

  const classes = twMerge(
    'w-30',
    policyType === 'None' && 'bg-zinc-100 dark:bg-zinc-800',
    policyType === 'Transfers' && 'bg-zinc-200 dark:bg-zinc-700',
    policyType === 'Calls' && 'bg-zinc-300 dark:bg-zinc-600',
    policyType === 'All' && 'bg-zinc-400 dark:bg-zinc-500',
  );

  const getTooltip = () => {
    const callPoliciesCount = session.payload.sessionSpec.callPolicies.length;
    const transferPoliciesCount = session.payload.sessionSpec.transferPolicies.length;

    if (policyType === 'None') {
      return t('address.sessions.tooltips.policy_type.none');
    }

    if (policyType === 'All') {
      return t('address.sessions.tooltips.policy_type.all', { callPoliciesCount, transferPoliciesCount });
    }

    if (policyType === 'Calls') {
      return t('address.sessions.tooltips.policy_type.calls', { callPoliciesCount });
    }

    if (policyType === 'Transfers') {
      return t('address.sessions.tooltips.policy_type.transfers', { transferPoliciesCount });
    }
  };

  return (
    // Add py-3.75 to match the height of the AssetCell from the AllowanceTable
    <div className="flex justify-start py-3.75">
      <WithHoverTooltip tooltip={getTooltip()}>
        <Label className={classes}>{t(`address.labels.policy_type.${policyType.toLowerCase()}`)}</Label>
      </WithHoverTooltip>
    </div>
  );
};

export default PolicyTypeCell;
