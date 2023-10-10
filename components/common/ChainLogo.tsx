import { getChainLogo, getChainName, isSupportedChain } from 'lib/utils/chains';
import { twMerge } from 'tailwind-merge';
import Logo from './Logo';
import WithHoverTooltip from './WithHoverTooltip';

interface Props {
  chainId: number;
  size?: number;
  tooltip?: boolean;
  className?: string;
}

const ChainLogo = ({ chainId, size, tooltip, className }: Props) => {
  const name = getChainName(chainId);
  const src = getChainLogo(chainId);
  const classes = twMerge(!isSupportedChain(chainId) && 'grayscale', className);

  if (tooltip) {
    return (
      <WithHoverTooltip tooltip={name} placement="top">
        <div>
          <Logo src={src} alt={name} size={size} border className={classes} />
        </div>
      </WithHoverTooltip>
    );
  }

  return <Logo src={src} alt={name} size={size} border className={classes} />;
};

export default ChainLogo;
