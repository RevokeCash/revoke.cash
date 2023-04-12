import { Table } from '@tanstack/react-table';
import Button from 'components/common/Button';
import type { AllowanceData } from 'lib/interfaces';
import useTranslation from 'next-translate/useTranslation';

interface Props {
  table: Table<AllowanceData>;
  allowances: Array<AllowanceData>;
}

const NoAllowancesFound = ({ table, allowances }: Props) => {
  const { t } = useTranslation();

  // If no allowances were found at all
  if (allowances.length === 0) {
    return <div>{t('address:allowances.none_found')}</div>;
  }

  // If no allowances were found after filtering
  return (
    <>
      <div>{t('address:allowances.none_found_filtered')}</div>
      <Button style="secondary" size="sm" onClick={() => table.resetColumnFilters()}>
        Clear Filters
      </Button>
    </>
  );
};

export default NoAllowancesFound;
