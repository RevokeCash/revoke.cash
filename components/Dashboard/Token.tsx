import AllowanceList from 'components/Dashboard/AllowanceList';
import TokenBalance from 'components/Dashboard/TokenBalance';
import { useAllowances } from 'lib/hooks/useAllowances';
import { useEthereum } from 'lib/hooks/useEthereum';
import { DashboardSettings, isERC721Token, TokenData } from 'lib/interfaces';
import { toFloat } from 'lib/utils';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { ClipLoader } from 'react-spinners';

interface Props {
  token: TokenData;
  inputAddress: string;
  openSeaProxyAddress?: string;
  settings: DashboardSettings;
}

function Token({ token, inputAddress, openSeaProxyAddress, settings }: Props) {
  const { selectedChainId } = useEthereum();
  const { allowances, loading, onRevoke } = useAllowances(token, inputAddress);

  if (loading) {
    return (
      <div className="Token">
        <ClipLoader size={20} color={'#000'} loading={loading} />
      </div>
    );
  }

  // Check whether the token has zero balance (depending on token type)
  const hasZeroBalance = isERC721Token(token)
    ? token.balance === '0'
    : toFloat(Number(token.balance), token.decimals) === '0.000';

  const hasNoAllowances = allowances.length === 0;

  // Do not render tokens without balance or allowances
  if (hasZeroBalance && hasNoAllowances) return null;

  // Do not render ERC1155 tokens without allowances
  if (token.balance === 'ERC1155' && hasNoAllowances) return null;

  // Do not render tokens without allowances if that is the setting
  if (!settings.includeTokensWithoutAllowances && hasNoAllowances) return null;

  const explorerUrl = `${getChainExplorerUrl(selectedChainId)}/address/${token.contract.address}`;

  return (
    <div className="Token">
      <TokenBalance symbol={token.symbol} icon={token.icon} balance={token.balance} explorerUrl={explorerUrl} />
      <AllowanceList
        token={token}
        allowances={allowances}
        inputAddress={inputAddress}
        openSeaProxyAddress={openSeaProxyAddress}
        onRevoke={onRevoke}
      />
    </div>
  );
}

export default Token;
