'use client';

import type { Status } from 'components/common/StatusLabel';
import StatusLabelMultiSelect from 'components/common/select/StatusLabelMultiSelect';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import type { HistoryEventCategory } from './columns';

interface EventTypeOption {
  value: HistoryEventCategory;
  labelKey: string;
  status: Status;
}

interface Props {
  eventTerms: string[];
  onEventTermsChange: (terms: string[]) => void;
}

// Statuses mirror EventTypeCell so the menu shows the same pills as the table.
const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  { value: 'approval', labelKey: 'address.history.approved', status: 'success' },
  { value: 'revocation', labelKey: 'address.history.revoked', status: 'danger' },
  { value: 'cancellation', labelKey: 'address.history.cancelled_signatures', status: 'warning' },
  { value: 'transfer', labelKey: 'address.history.approved_transfer', status: 'info' },
];

const normalise = (value: string) => value.trim().toLowerCase();

// Connects the event terms of the search box to the event type multi-select
const HistoryEventTypeMultiSelect = ({ eventTerms, onEventTermsChange }: Props) => {
  const t = useTranslations();

  const options = useMemo(
    () => EVENT_TYPE_OPTIONS.map(({ value, labelKey, status }) => ({ value, label: t(labelKey), status })),
    [t],
  );

  const selectedEventTypes = EVENT_TYPE_OPTIONS.map((option) => option.value).filter((eventType) =>
    eventTerms.some((term) => normalise(term) === eventType),
  );

  return (
    <StatusLabelMultiSelect
      instanceId="history-event-type-multi-select"
      aria-label={t('address.headers.event_type')}
      options={options}
      selectedValues={selectedEventTypes}
      onChange={onEventTermsChange}
      className="w-full sm:w-44 shrink-0"
    />
  );
};

export default HistoryEventTypeMultiSelect;
