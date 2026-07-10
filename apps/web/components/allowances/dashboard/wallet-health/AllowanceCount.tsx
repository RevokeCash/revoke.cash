import type { TokenAllowanceData } from '@revoke.cash/core/allowances';
import type { Nullable } from '@revoke.cash/core/types';
import Loader from 'components/common/Loader';
import Spinner from 'components/common/Spinner';
import { useTranslations } from 'next-intl';

interface Props {
  allowances?: TokenAllowanceData[];
  isLoading: boolean;
  isCounting?: boolean;
  error?: Nullable<Error>;
}

const AllowancesCount = ({ allowances, isLoading, isCounting, error }: Props) => {
  const t = useTranslations();

  if (error) return null;

  return (
    <Loader isLoading={isLoading}>
      <div className="flex flex-col items-start md:items-center gap-0.5">
        <div className="text-xs font-semibold tracking-wide uppercase text-zinc-600 dark:text-zinc-400 md:text-center">
          {t('address.wallet_health.allowances')}
        </div>
        <div className="font-bold total-allowances flex items-center gap-1.5">
          {isLoading ? '000' : allowances?.length}
          {isCounting && <Spinner className="w-3 h-3 mx-0" />}
        </div>
      </div>
    </Loader>
  );
};

export default AllowancesCount;
