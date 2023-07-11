import ChainOverlayLogo from 'components/common/ChainOverlayLogo';
import Href from 'components/common/Href';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
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

  // This is pretty hacky, but it works to detect that we're on the address page, so single chain usage
  const isOnAddressPage = typeof window !== 'undefined' && window.location.pathname.includes('/address/');

  useLayoutEffect(() => {
    if (ref.current.clientWidth < ref.current.scrollWidth) {
      setShowTooltip(true);
    }
  }, [ref]);

  const explorerUrl = `${getChainExplorerUrl(allowance.chainId)}/address/${allowance.contract.address}`;

  let link = (
    <Href href={explorerUrl} underline="hover" external className="max-w-[8rem] lg:max-w-[12rem] truncate" ref={ref}>
      {allowance.symbol}
    </Href>
  );

  if (showTooltip) {
    link = <WithHoverTooltip tooltip={allowance.symbol}>{link}</WithHoverTooltip>;
  }

  return (
    <div className="flex items-center gap-1 py-1 w-40 lg:w-56">
      <div className="flex flex-col items-start gap-0.5">
        <div className="flex items-center gap-2 text-base">
          <ChainOverlayLogo
            src={allowance.icon}
            alt={allowance.symbol}
            chainId={isOnAddressPage ? undefined : allowance.chainId}
            size={24}
            overlaySize={16}
          />
          {link}
        </div>

        <div className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[10rem] lg:max-w-[14rem] truncate">
          {getBalanceText(allowance.symbol, allowance.balance, allowance.decimals)}
        </div>
      </div>
    </div>
  );
};

export default AssetCell;
