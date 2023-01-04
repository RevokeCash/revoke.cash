import Href from 'components/common/Href';
import TokenLogo from 'components/common/TokenLogo';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useEthereum } from 'lib/hooks/useEthereum';
import type { AllowanceData } from 'lib/interfaces';
import { getBalanceText } from 'lib/utils';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { useLayoutEffect, useRef, useState } from 'react';

interface Props {
  allowance: AllowanceData;
}

const AssetCell = ({ allowance }: Props) => {
  const ref = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const { selectedChainId } = useEthereum();

  useLayoutEffect(() => {
    if (ref.current.clientWidth < ref.current.scrollWidth) {
      setShowTooltip(true);
    }
  }, [ref]);

  const explorerUrl = `${getChainExplorerUrl(selectedChainId)}/token/${allowance.contract.address}`;

  let link = (
    <Href href={explorerUrl} underline="hover" external className="max-w-[8rem] lg:max-w-[12rem] truncate" ref={ref}>
      {allowance.symbol}
    </Href>
  );

  if (showTooltip) {
    link = <WithHoverTooltip tooltip={allowance.symbol}>{link}</WithHoverTooltip>;
  }

  return (
    <div className="flex items-center gap-1 py-1">
      <div className="flex flex-col items-start gap-0.5">
        <div className="flex items-center gap-2 text-base leading-tight">
          <TokenLogo src={allowance.icon} alt={allowance.symbol} size={20} />
          {link}
        </div>

        <div className="text-xs leading-tight text-gray-400 dark:text-gray-500 max-w-[10rem] lg:max-w-[14rem] truncate">
          {getBalanceText(allowance.symbol, allowance.balance, allowance.decimals)}
        </div>
      </div>
    </div>
  );
};

export default AssetCell;
