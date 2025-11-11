'use client';

import ChainOverlayLogo from 'components/common/ChainOverlayLogo';
import Href from 'components/common/Href';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { getChainExplorerUrl } from 'lib/utils/chains';
import type { TokenData } from 'lib/utils/tokens';
import { useRef } from 'react';
import type { Address } from 'viem';

interface Props {
  asset: Pick<TokenData, 'metadata' | 'chainId'> & { contract: { address: Address } };
}

const AssetDisplay = ({ asset }: Props) => {
  const ref = useRef<HTMLAnchorElement>(null);

  // This is pretty hacky, but it works to detect that we're on the address page, so single chain usage
  const isOnAddressPage = window?.location?.pathname?.includes('/address/');

  const explorerUrl = `${getChainExplorerUrl(asset.chainId)}/address/${asset.contract.address}`;

  return (
    <div className="flex items-center gap-2 text-base w-48 lg:w-56">
      <ChainOverlayLogo
        src={asset.metadata.icon}
        alt={asset.metadata.symbol}
        chainId={isOnAddressPage ? undefined : asset.chainId}
        size={24}
        overlaySize={16}
      />
      <WithHoverTooltip tooltip={asset.metadata.symbol}>
        <div className="truncate">
          <Href href={explorerUrl} underline="hover" external ref={ref}>
            {asset.metadata.symbol}
          </Href>
        </div>
      </WithHoverTooltip>
    </div>
  );
};

export default AssetDisplay;
