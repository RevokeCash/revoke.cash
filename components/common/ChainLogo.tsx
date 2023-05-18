import { getChainLogo, getChainName, isSupportedChain } from 'lib/utils/chains';
import { twMerge } from 'tailwind-merge';
import Logo from './Logo';
import WithHoverTooltip from './WithHoverTooltip';

interface Props {
  chainId: number;
  size?: number;
  tooltip?: boolean;
}

const ChainLogo = ({ chainId, size, tooltip }: Props) => {
  const name = getChainName(chainId);
  const src = getChainLogo(chainId);
  const className = twMerge(!isSupportedChain(chainId) && 'grayscale');

  if (tooltip) {
    return (
      <WithHoverTooltip tooltip={name} placement="top">
        <div>
          <Logo src={src} alt={name} size={size} border className={className} />
        </div>
      </WithHoverTooltip>
    );
  }

  return <Logo src={src} alt={name} size={size} border className={className} />;
};

export default ChainLogo;
