import Loader from 'components/common/Loader';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import type { Nullable } from 'lib/interfaces';
import { isNullish } from 'lib/utils';
import { getChainNativeToken } from 'lib/utils/chains';
import { formatFiatBalance, formatFixedPointBigInt } from 'lib/utils/formatting';
import { twMerge } from 'tailwind-merge';

interface Props {
  isLoading: boolean;
  balance?: bigint;
  price?: Nullable<number>;
  className?: string;
}

const BalanceDisplay = ({ isLoading, balance, price, className }: Props) => {
  const { selectedChainId } = useAddressPageContext();
  const classes = twMerge('flex gap-0.5 items-center leading-tight shrink-0', className);
  const nativeToken = getChainNativeToken(selectedChainId);

  const fiatBalanceText =
    !isLoading && !isNullish(balance) && !isNullish(price) && formatFiatBalance(balance, price, 18);

  const placeholder = <div className={classes}>X.XXX {nativeToken} ($X,XXX.XX)</div>;

  return (
    <Loader isLoading={isLoading || isNullish(balance)} loadingChildren={placeholder} className="rounded-md">
      <div className={classes}>
        <span>{isNullish(balance) ? null : formatFixedPointBigInt(balance, 18)}</span>
        <span className="font-bold">{nativeToken}</span>
        {fiatBalanceText ? <span>({fiatBalanceText})</span> : null}
      </div>
    </Loader>
  );
};

export default BalanceDisplay;
