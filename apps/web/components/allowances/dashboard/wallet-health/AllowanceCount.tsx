import type { TokenAllowanceData } from '@revoke.cash/core/allowances';
import type { Nullable } from '@revoke.cash/core/types';
import Loader from 'components/common/Loader';
import { useTranslations } from 'next-intl';

interface Props {
  allowances?: TokenAllowanceData[];
  isLoading: boolean;
  error?: Nullable<Error>;
  multichain?: boolean;
}

const AllowancesCount = ({ allowances, isLoading, error, multichain }: Props) => {
  const t = useTranslations();

  if (error) return null;

  return (
    <Loader isLoading={isLoading}>
      <div className="flex flex-col items-start md:items-center gap-0.5">
        <div className="text-xs font-semibold tracking-wide uppercase text-zinc-600 dark:text-zinc-400 md:text-center">
          {t(multichain ? 'address.wallet_health.total_allowances' : 'address.wallet_health.allowances')}
        </div>
        <div className="font-bold total-allowances">{isLoading ? '000' : allowances?.length}</div>
      </div>
    </Loader>
  );
};

export default AllowancesCount;
