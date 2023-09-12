import Loader from 'components/common/Loader';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { getFiatBalanceText, isNullish, toFloat } from 'lib/utils';
import { getChainNativeToken } from 'lib/utils/chains';
import { twMerge } from 'tailwind-merge';

interface Props {
  isLoading: boolean;
  balance: bigint;
  price?: number;
  className?: string;
}

const BalanceDisplay = ({ isLoading, balance, price, className }: Props) => {
  const { selectedChainId } = useAddressPageContext();
  const classes = twMerge('flex gap-0.5 items-center leading-none', className);
  const nativeToken = getChainNativeToken(selectedChainId);

  const fiatBalanceText =
    !isLoading && !isNullish(balance) && !isNullish(price) && getFiatBalanceText(balance, price, 18);

  return (
    <Loader isLoading={isLoading || balance === undefined} loadingChildren={<div>0.000 {nativeToken} ($1,000.00)</div>}>
      <div className={classes}>
        <span>{toFloat(balance, 18)}</span>
        <span className="font-bold">{nativeToken}</span>
        {fiatBalanceText ? <span>({fiatBalanceText})</span> : null}
      </div>
    </Loader>
  );
};

export default BalanceDisplay;
