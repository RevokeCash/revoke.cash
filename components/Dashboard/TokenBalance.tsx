import TokenLogo from 'components/common/TokenLogo';
import { useEthereum } from 'lib/hooks/useEthereum';
import type { Erc20TokenData, TokenData } from 'lib/interfaces';
import { getBalanceText } from 'lib/utils';
import { getChainExplorerUrl } from 'lib/utils/chains';

interface Props {
  token: TokenData;
}

const TokenBalance = ({ token }: Props) => {
  const { selectedChainId } = useEthereum();
  const explorerUrl = `${getChainExplorerUrl(selectedChainId)}/address/${token.contract.address}`;

  return (
    <a href={explorerUrl} className="hover:underline text-black visited:text-black">
      <TokenLogo src={token.icon} alt={token.symbol} />
      <p className="ml-1 inline">{getBalanceText(token.symbol, token.balance, (token as Erc20TokenData).decimals)}</p>
    </a>
  );
};

export default TokenBalance;
