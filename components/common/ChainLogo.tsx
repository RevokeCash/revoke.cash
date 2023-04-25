import { getChainLogo, getChainName } from 'lib/utils/chains';
import Logo from './Logo';
import WithHoverTooltip from './WithHoverTooltip';

interface Props {
  chainId: number;
  size?: number;
  tooltip?: boolean;
}

const ChainLogo = ({ chainId, size, tooltip }: Props) => {
  if (tooltip) {
    return (
      <WithHoverTooltip tooltip={getChainName(chainId)} placement="top">
        <div>
          <Logo src={getChainLogo(chainId)} alt={getChainName(chainId)} size={size} border />
        </div>
      </WithHoverTooltip>
    );
  }

  return <Logo src={getChainLogo(chainId)} alt={getChainName(chainId)} size={size} border />;
};

export default ChainLogo;
