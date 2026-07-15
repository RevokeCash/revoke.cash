import { InformationCircleIcon } from '@heroicons/react/24/outline';
import GasPump from 'components/common/icons/GasPump';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import type { SerializedMonthlyBudget } from 'lib/hooks/auto-revoke/useAutoRevokeBudget';
import { useTranslations } from 'next-intl';

interface Props {
  budget: SerializedMonthlyBudget;
}

const AutoRevokeBudgetSummary = ({ budget }: Props) => {
  const t = useTranslations();
  const usedFraction = budget.budgetUsd === 0 ? 0 : Math.min(1, budget.committedUsd / budget.budgetUsd);
  const resetDate = new Date(budget.period.end).toLocaleDateString();

  return (
    <div className="flex flex-col gap-1.5 min-w-52">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
          <GasPump className="h-4 w-4 shrink-0" />
          {t('account.auto_revoke.budget.used', {
            used: `$${budget.committedUsd.toFixed(2)}`,
            total: `$${budget.budgetUsd.toFixed(2)}`,
          })}
        </span>
        <WithHoverTooltip
          tooltip={`${t('account.auto_revoke.budget.shared')} ${t('account.auto_revoke.budget.per_action_cap', { cap: `$${budget.maxActionCostUsd.toFixed(2)}` })} ${t('account.auto_revoke.budget.exploit_protection')}`}
        >
          <InformationCircleIcon className="h-4 w-4 text-zinc-400" />
        </WithHoverTooltip>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div className="h-full rounded-full bg-brand" style={{ width: `${usedFraction * 100}%` }} />
      </div>
      <span className="text-xs text-zinc-500 dark:text-zinc-500">
        {t('account.auto_revoke.budget.resets', { date: resetDate })}
      </span>
      {budget.remainingUsd <= 0 && (
        <span className="text-xs text-zinc-500 dark:text-zinc-500">
          {t('account.auto_revoke.budget.exploit_protection')}
        </span>
      )}
    </div>
  );
};

export default AutoRevokeBudgetSummary;
