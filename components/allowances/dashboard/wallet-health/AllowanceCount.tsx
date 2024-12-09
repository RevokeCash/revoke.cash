import Loader from 'components/common/Loader';
import type { Nullable } from 'lib/interfaces';
import { isNullish } from 'lib/utils';
import type { TokenAllowanceData } from 'lib/utils/allowances';
import { useTranslations } from 'next-intl';

interface Props {
  allowances?: TokenAllowanceData[];
  isLoading: boolean;
  error?: Nullable<Error>;
}

const AllowancesCount = ({ allowances, isLoading, error }: Props) => {
  const t = useTranslations();

  if (error) return null;

  const actualAllowances = allowances?.filter((allowance) => !isNullish(allowance.payload));

  return (
    <Loader isLoading={isLoading}>
      <div className="flex flex-col items-center gap-0.5">
        <div className="text-zinc-600 dark:text-zinc-400 text-center">
          {t('address.wallet_health.total_allowances')}
        </div>
        <div className="font-bold total-allowances">{isLoading ? '000' : actualAllowances?.length}</div>
      </div>
    </Loader>
  );
};

export default AllowancesCount;
