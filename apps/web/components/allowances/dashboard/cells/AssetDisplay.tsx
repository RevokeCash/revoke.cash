'use client';

import { getChainExplorerUrl, getChainName } from '@revoke.cash/core/chains';
import type { TokenData } from '@revoke.cash/core/tokens';
import ChainOverlayLogo from 'components/common/ChainOverlayLogo';
import Href from 'components/common/Href';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useRef } from 'react';
import type { Address } from 'viem';

interface Props {
  asset: Pick<TokenData, 'metadata' | 'chainId'> & { contract: { address: Address } };
  showChainOverlay?: boolean;
}

const AssetDisplay = ({ asset, showChainOverlay = false }: Props) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const explorerUrl = `${getChainExplorerUrl(asset.chainId)}/address/${asset.contract.address}`;
  const tooltip = showChainOverlay
    ? `${asset.metadata.symbol} on ${getChainName(asset.chainId)}`
    : asset.metadata.symbol;

  return (
    <div className="flex items-center gap-2 text-base w-48 lg:w-56">
      <ChainOverlayLogo
        src={asset.metadata.icon}
        alt={asset.metadata.symbol}
        chainId={showChainOverlay ? asset.chainId : undefined}
        size={24}
        overlaySize={20}
      />
      <WithHoverTooltip tooltip={tooltip}>
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
