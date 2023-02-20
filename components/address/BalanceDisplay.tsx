import Spinner from 'components/common/Spinner';
import { useAddressPageContext } from 'lib/hooks/useAddressContext';
import { toFloat } from 'lib/utils';
import { getChainNativeToken } from 'lib/utils/chains';
import { classNames } from 'lib/utils/styles';

interface Props {
  balance: string;
  className?: string;
}

const BalanceDisplay = ({ balance, className }: Props) => {
  const { selectedChainId } = useAddressPageContext();
  const classes = classNames('flex gap-0.5 items-center leading-none', className);
  const nativeToken = getChainNativeToken(selectedChainId);

  return (
    <div className={classes}>
      <span>{balance ? toFloat(balance, 18) : <Spinner className="w-3 h-3" />}</span>
      <span className="font-bold">{nativeToken}</span>
    </div>
  );
};

export default BalanceDisplay;
