'use client';

import type { AutoRevokeRules, RiskSensitivity } from '@revoke.cash/core/auto-revoke/evaluation/rules';
import SegmentedControl, { type SegmentedOption } from 'components/common/SegmentedControl';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';
import AutoRevokeRuleToggle from './AutoRevokeRuleToggle';
import StaleApprovalDaysInput from './StaleApprovalDaysInput';

interface Props {
  rules: AutoRevokeRules;
  onUpdate: (ruleData: Partial<AutoRevokeRules>) => void;
  isAdmin?: boolean;
  readOnly?: boolean;
  managedByLabel?: string;
}

const AutoRevokeRulesEditor = ({ rules, onUpdate, isAdmin = false, readOnly = false, managedByLabel }: Props) => {
  const t = useTranslations();

  const sensitivityOptions = useMemo<SegmentedOption<RiskSensitivity>[]>(
    () => [
      { value: 'medium', label: t('account.auto_revoke.rules.sensitivity_medium') },
      { value: 'high', label: t('account.auto_revoke.rules.sensitivity_high') },
      { value: 'exploits_only', label: t('account.auto_revoke.rules.sensitivity_exploits_only') },
    ],
    [t],
  );

  return (
    <div>
      <div className={twMerge('flex items-center justify-between', isAdmin ? 'mb-2' : 'mb-3')}>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {isAdmin ? t('account.auto_revoke.rules.title_defaults') : t('account.auto_revoke.rules.title')}
        </h3>
        {managedByLabel && <span className="text-xs text-zinc-500 dark:text-zinc-500">{managedByLabel}</span>}
      </div>
      {isAdmin && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          {t('account.auto_revoke.rules.defaults_description')}
        </p>
      )}

      <div className="flex flex-col gap-4">
        <AutoRevokeRuleToggle
          label={t('account.auto_revoke.rules.risk_detection')}
          description={t('account.auto_revoke.rules.risk_detection_description')}
          enabled={rules.riskDetectionEnabled}
          onToggle={(enabled) => onUpdate({ riskDetectionEnabled: enabled })}
          disabled={readOnly}
        >
          <SegmentedControl
            options={sensitivityOptions}
            value={rules.riskSensitivity}
            onChange={(riskSensitivity) => onUpdate({ riskSensitivity })}
            disabled={readOnly}
          />
        </AutoRevokeRuleToggle>

        <AutoRevokeRuleToggle
          label={t('account.auto_revoke.rules.stale_approval')}
          description={t('account.auto_revoke.rules.stale_approval_description')}
          enabled={rules.staleApprovalEnabled}
          onToggle={(enabled) => onUpdate({ staleApprovalEnabled: enabled })}
          disabled={readOnly}
        >
          <StaleApprovalDaysInput
            value={rules.staleApprovalThresholdDays}
            onChange={(staleApprovalThresholdDays) => onUpdate({ staleApprovalThresholdDays })}
            disabled={readOnly}
          />
        </AutoRevokeRuleToggle>
      </div>
    </div>
  );
};

export default AutoRevokeRulesEditor;
