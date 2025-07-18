import ChainOverlayLogo from 'components/common/ChainOverlayLogo';
import Href from 'components/common/Href';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { getChainExplorerUrl } from 'lib/utils/chains';
import type { ApprovalTokenEvent } from 'lib/utils/events';
import type { TokenMetadata } from 'lib/utils/tokens';
import { useLayoutEffect, useRef, useState } from 'react';

interface Props {
  event: ApprovalTokenEvent & { metadata?: TokenMetadata | null };
}

const HistoryAssetCell = ({ event }: Props) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const metadata = event.metadata;

  const isOnAddressPage = typeof window !== 'undefined' && window.location.pathname.includes('/address/');

  useLayoutEffect(() => {
    if (!ref.current) return;
    if (ref.current.clientWidth < ref.current.scrollWidth) {
      setShowTooltip(true);
    }
  }, []);

  const explorerUrl = `${getChainExplorerUrl(event.chainId)}/address/${event.token}`;
  const displayText = metadata?.symbol || `${event.token.slice(0, 8)}...`;

  let link = (
    <Href href={explorerUrl} underline="hover" external className="truncate" ref={ref}>
      {displayText}
    </Href>
  );

  if (showTooltip) {
    link = <WithHoverTooltip tooltip={metadata?.symbol || event.token}>{link}</WithHoverTooltip>;
  }

  return (
    <div className="flex items-center gap-1 py-1 w-48 lg:w-56">
      <div className="flex flex-col items-start gap-0.5">
        <div className="flex items-center gap-2 text-base">
          <ChainOverlayLogo
            src={metadata?.icon}
            alt={metadata?.symbol || 'Token'}
            chainId={isOnAddressPage ? undefined : event.chainId}
            size={24}
            overlaySize={16}
          />
          {link}
        </div>

        <div className="text-xs text-zinc-500 dark:text-zinc-400 h-4" />
      </div>
    </div>
  );
};

export default HistoryAssetCell;
