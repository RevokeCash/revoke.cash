import type { AllowanceData } from 'lib/interfaces';
import { useTranslations } from 'next-intl';

interface Props {
  allowances: Array<AllowanceData>;
}

const NoAllowancesFound = ({ allowances }: Props) => {
  const t = useTranslations();

  // If no allowances were found at all
  if (allowances.length === 0) {
    return <div>{t('address.allowances.none_found')}</div>;
  }

  // If no allowances were found after filtering
  return <div>{t('address.allowances.none_found_filtered')}</div>;
};

export default NoAllowancesFound;
