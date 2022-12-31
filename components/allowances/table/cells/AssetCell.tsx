import Href from 'components/common/Href';
import TokenLogo from 'components/common/TokenLogo';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useEthereum } from 'lib/hooks/useEthereum';
import type { AllowanceData } from 'lib/interfaces';
import { getBalanceText, shortenString } from 'lib/utils';
import { getChainExplorerUrl } from 'lib/utils/chains';

interface Props {
  allowance: AllowanceData;
}

const AssetCell = ({ allowance }: Props) => {
  const { selectedChainId } = useEthereum();
  const explorerUrl = `${getChainExplorerUrl(selectedChainId)}/address/${allowance.contract.address}`;

  let link = (
    <Href href={explorerUrl} underline="hover" external className="max-w-[10rem] truncate">
      {shortenString(allowance.symbol, 24)}
    </Href>
  );

  if (allowance.symbol.length > 24) {
    link = <WithHoverTooltip tooltip={allowance.symbol}>{link}</WithHoverTooltip>;
  }

  return (
    <div className="flex items-center gap-1 py-1">
      <div className="flex flex-col items-start gap-0.5">
        <div className="flex items-center gap-2 text-base leading-tight">
          <TokenLogo src={allowance.icon} alt={allowance.symbol} size={20} />
          {link}
        </div>

        <div className="text-xs leading-tight text-gray-400 dark:text-gray-500 max-w-[10rem] truncate">
          {shortenString(getBalanceText(allowance.symbol, allowance.balance, allowance.decimals), 32)}
        </div>
      </div>
    </div>
  );
};

export default AssetCell;
