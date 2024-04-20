'use client';

import ChainOverlayLogo from 'components/common/ChainOverlayLogo';
import Href from 'components/common/Href';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import type { BaseTokenData } from 'lib/interfaces';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { formatBalance, formatFiatBalance } from 'lib/utils/formatting';
import { useLayoutEffect, useRef, useState } from 'react';

interface Props {
  asset: BaseTokenData;
}

const AssetCell = ({ asset }: Props) => {
  const ref = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // This is pretty hacky, but it works to detect that we're on the address page, so single chain usage
  const isOnAddressPage = typeof window !== 'undefined' && window.location.pathname.includes('/address/');

  useLayoutEffect(() => {
    if (ref.current.clientWidth < ref.current.scrollWidth) {
      setShowTooltip(true);
    }
  }, [ref]);

  const explorerUrl = `${getChainExplorerUrl(asset.chainId)}/address/${asset.contract.address}`;

  let link = (
    <Href href={explorerUrl} underline="hover" external className="truncate" ref={ref}>
      {asset.metadata.symbol}
    </Href>
  );

  if (showTooltip) {
    link = <WithHoverTooltip tooltip={asset.metadata.symbol}>{link}</WithHoverTooltip>;
  }

  const balanceText = formatBalance(asset.metadata.symbol, asset.balance, asset.metadata.decimals);
  const fiatBalanceText = formatFiatBalance(asset.balance, asset.metadata.price, asset.metadata.decimals);

  return (
    <div className="flex items-center gap-1 py-1">
      <div className="flex flex-col items-start gap-0.5">
        <div className="flex items-center gap-2 text-base w-48 lg:w-56">
          <ChainOverlayLogo
            src={asset.metadata.icon}
            alt={asset.metadata.symbol}
            chainId={isOnAddressPage ? undefined : asset.chainId}
            size={24}
            overlaySize={16}
          />
          {link}
        </div>

        <div className="text-xs text-zinc-500 dark:text-zinc-400 flex gap-1 w-48 lg:w-56">
          <div className="truncate shrink">{balanceText}</div>
          {fiatBalanceText ? <div className="grow shrink-0">({fiatBalanceText})</div> : null}
        </div>
      </div>
    </div>
  );
};

export default AssetCell;
