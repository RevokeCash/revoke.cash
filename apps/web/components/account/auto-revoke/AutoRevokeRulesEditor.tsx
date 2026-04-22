'use client';

import type { AutoRevokeRules, RiskSensitivity } from '@revoke.cash/core/auto-revoke/types';
import SegmentedControl, { type SegmentedOption } from 'components/common/SegmentedControl';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import AutoRevokeRuleToggle from './AutoRevokeRuleToggle';
import StaleApprovalDaysInput from './StaleApprovalDaysInput';

interface Props {
  rules: AutoRevokeRules;
  onUpdate: (ruleData: Partial<AutoRevokeRules>) => void;
  disabled?: boolean;
  isAdmin?: boolean;
  readOnly?: boolean;
  managedByLabel?: string;
}

const AutoRevokeRulesEditor = ({
  rules,
  onUpdate,
  disabled = false,
  isAdmin = false,
  readOnly = false,
  managedByLabel,
}: Props) => {
  const t = useTranslations();
  const isDisabled = disabled || readOnly;

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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {isAdmin ? t('account.auto_revoke.rules.title_defaults') : t('account.auto_revoke.rules.title')}
        </h3>
        {managedByLabel && <span className="text-xs text-zinc-400 dark:text-zinc-500">{managedByLabel}</span>}
      </div>

      <div className="flex flex-col gap-4">
        <AutoRevokeRuleToggle
          label={t('account.auto_revoke.rules.risk_detection')}
          description={t('account.auto_revoke.rules.risk_detection_description')}
          enabled={rules.riskDetectionEnabled}
          onToggle={(enabled) => onUpdate({ riskDetectionEnabled: enabled })}
          disabled={isDisabled}
        >
          <SegmentedControl
            options={sensitivityOptions}
            value={rules.riskSensitivity}
            onChange={(riskSensitivity) => onUpdate({ riskSensitivity })}
            disabled={isDisabled}
          />
        </AutoRevokeRuleToggle>

        <AutoRevokeRuleToggle
          label={t('account.auto_revoke.rules.stale_approval')}
          description={t('account.auto_revoke.rules.stale_approval_description')}
          enabled={rules.staleApprovalEnabled}
          onToggle={(enabled) => onUpdate({ staleApprovalEnabled: enabled })}
          disabled={isDisabled}
        >
          <StaleApprovalDaysInput
            value={rules.staleApprovalThresholdDays}
            onChange={(staleApprovalThresholdDays) => onUpdate({ staleApprovalThresholdDays })}
            disabled={isDisabled}
          />
        </AutoRevokeRuleToggle>
      </div>
    </div>
  );
};

export default AutoRevokeRulesEditor;
