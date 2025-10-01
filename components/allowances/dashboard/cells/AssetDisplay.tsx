'use client';

import ChainOverlayLogo from 'components/common/ChainOverlayLogo';
import Href from 'components/common/Href';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { getChainExplorerUrl } from 'lib/utils/chains';
import type { TokenData } from 'lib/utils/tokens';
import { useLayoutEffect, useRef, useState } from 'react';
import type { Address } from 'viem';

interface Props {
  asset: Pick<TokenData, 'metadata' | 'chainId'> & { contract: { address: Address } };
}

const AssetDisplay = ({ asset }: Props) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // This is pretty hacky, but it works to detect that we're on the address page, so single chain usage
  const isOnAddressPage = window?.location?.pathname?.includes('/address/');

  useLayoutEffect(() => {
    if (!ref.current) return;
    if (ref.current.clientWidth < ref.current.scrollWidth) {
      setShowTooltip(true);
    }
  }, []);

  const explorerUrl = `${getChainExplorerUrl(asset.chainId)}/address/${asset.contract.address}`;

  let link = (
    <Href href={explorerUrl} underline="hover" external className="truncate" ref={ref}>
      {asset.metadata.symbol}
    </Href>
  );

  if (showTooltip) {
    link = <WithHoverTooltip tooltip={asset.metadata.symbol}>{link}</WithHoverTooltip>;
  }

  return (
    <div className="flex items-center gap-2 text-base">
      <ChainOverlayLogo
        src={asset.metadata.icon}
        alt={asset.metadata.symbol}
        chainId={isOnAddressPage ? undefined : asset.chainId}
        size={24}
        overlaySize={16}
      />
      {link}
    </div>
  );
};

export default AssetDisplay;
