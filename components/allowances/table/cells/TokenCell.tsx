import Href from 'components/common/Href';
import TokenLogo from 'components/common/TokenLogo';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useEthereum } from 'lib/hooks/useEthereum';
import type { AllowanceData } from 'lib/interfaces';
import { getBalanceText, shortenName } from 'lib/utils';
import { getChainExplorerUrl } from 'lib/utils/chains';

interface Props {
  allowance: AllowanceData;
}

const TokenCell = ({ allowance }: Props) => {
  const { selectedChainId } = useEthereum();
  const explorerUrl = `${getChainExplorerUrl(selectedChainId)}/address/${allowance.contract.address}`;

  let link = (
    <Href href={explorerUrl} style="black" underline="hover" external>
      {shortenName(allowance.symbol)}
    </Href>
  );

  if (allowance.symbol.length > 16) {
    link = <WithHoverTooltip tooltip={allowance.symbol}>{link}</WithHoverTooltip>;
  }

  return (
    <div className="flex justify-between items-center gap-2">
      <div className="flex items-center gap-1">
        <TokenLogo src={allowance.icon} alt={allowance.symbol} />
        <div className="flex flex-col items-start">
          {link}
          <div className="text-xs text-gray-400">
            {getBalanceText(allowance.symbol, allowance.balance, allowance.decimals)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenCell;
