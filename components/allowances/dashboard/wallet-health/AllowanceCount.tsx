import Loader from 'components/common/Loader';
import useTranslation from 'next-translate/useTranslation';
import { AllowanceData } from 'lib/interfaces';

interface Props {
  allowances: AllowanceData[];
  isLoading: boolean;
  error?: Error;
}

const AllowancesCount = ({ allowances, isLoading, error }: Props) => {
  const { t } = useTranslation();

  if (error) return null;

  const actualAllowances = allowances?.filter((allowance) => !!allowance.spender);

  return (
    <Loader isLoading={isLoading}>
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-zinc-600 dark:text-zinc-400 text-center">
          {t('address:wallet_health.total_allowances')}
        </div>
        <div className="font-bold">{isLoading ? '000' : actualAllowances?.length}</div>
      </div>
    </Loader>
  );
};

export default AllowancesCount;
