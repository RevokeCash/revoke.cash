import TokenLogo from 'components/common/TokenLogo';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useEthereum } from 'lib/hooks/useEthereum';
import type { AllowanceData, Erc20TokenData } from 'lib/interfaces';
import { getBalanceText, shortenName } from 'lib/utils';
import { getChainExplorerUrl } from 'lib/utils/chains';

interface Props {
  allowance: AllowanceData;
}

const TokenCell = ({ allowance }: Props) => {
  const { selectedChainId } = useEthereum();
  const explorerUrl = `${getChainExplorerUrl(selectedChainId)}/address/${allowance.contract.address}`;

  let link = (
    <a href={explorerUrl} className="hover:underline text-black visited:text-black">
      {shortenName(allowance.symbol)}
    </a>
  );

  if (allowance.symbol.length > 20) {
    link = <WithHoverTooltip tooltip={allowance.symbol}>{link}</WithHoverTooltip>;
  }

  return (
    <div className="flex items-center gap-1">
      <TokenLogo src={allowance.icon} alt={allowance.symbol} />
      <div className="flex flex-col items-start">
        {link}
        <div className="text-xs text-gray-400">
          {getBalanceText(allowance.symbol, allowance.balance, (allowance as Erc20TokenData).decimals)}
        </div>
      </div>
    </div>
  );
};

export default TokenCell;
