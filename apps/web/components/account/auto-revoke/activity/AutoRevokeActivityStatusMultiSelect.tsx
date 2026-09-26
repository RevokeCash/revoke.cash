'use client';

import StatusLabelMultiSelect from 'components/common/select/StatusLabelMultiSelect';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { ACTIVITY_STATUS_STYLES, type ActivityStatusKey } from './AutoRevokeActivityStatusBadge';

// Final outcomes first. "skipped" is left out because the activity feed never contains skipped actions.
const STATUS_KEYS: ActivityStatusKey[] = ['revoked', 'failed', 'submitting', 'pending'];

interface Props {
  selectedStatusKeys: ActivityStatusKey[];
  onChange: (statusKeys: ActivityStatusKey[]) => void;
  className?: string;
}

const AutoRevokeActivityStatusMultiSelect = ({ selectedStatusKeys, onChange, className }: Props) => {
  const t = useTranslations();

  const options = useMemo(
    () =>
      STATUS_KEYS.map((statusKey) => ({
        value: statusKey,
        label: t(`account.auto_revoke.activity.status.${statusKey}`),
        status: ACTIVITY_STATUS_STYLES[statusKey],
      })),
    [t],
  );

  return (
    <StatusLabelMultiSelect
      instanceId="auto-revoke-activity-status-multi-select"
      aria-label={t('account.auto_revoke.activity.columns.status')}
      options={options}
      selectedValues={selectedStatusKeys}
      onChange={onChange}
      className={className}
    />
  );
};

export default AutoRevokeActivityStatusMultiSelect;
