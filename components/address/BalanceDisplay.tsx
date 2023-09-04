import Spinner from 'components/common/Spinner';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { toFloat } from 'lib/utils';
import { getChainNativeToken } from 'lib/utils/chains';
import { twMerge } from 'tailwind-merge';

interface Props {
  balance: bigint;
  className?: string;
}

const BalanceDisplay = ({ balance, className }: Props) => {
  const { selectedChainId } = useAddressPageContext();
  const classes = twMerge('flex gap-0.5 items-center leading-none', className);
  const nativeToken = getChainNativeToken(selectedChainId);

  return (
    <div className={classes}>
      <span>{balance !== undefined ? toFloat(balance, 18) : <Spinner className="w-3 h-3" />}</span>
      <span className="font-bold">{nativeToken}</span>
    </div>
  );
};

export default BalanceDisplay;
