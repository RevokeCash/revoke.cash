import AllowanceList from 'components/Dashboard/AllowanceList';
import TokenBalance from 'components/Dashboard/TokenBalance';
import { useEthereum } from 'lib/hooks/useEthereum';
import { DashboardSettings, Erc721TokenData, IERC721Allowance } from 'lib/interfaces';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { getLimitedAllowancesFromApprovals, getUnlimitedAllowancesFromApprovals } from 'lib/utils/erc721';
import { useEffect, useState } from 'react';
import { ClipLoader } from 'react-spinners';

interface Props {
  token: Erc721TokenData;
  inputAddress: string;
  openSeaProxyAddress?: string;
  settings: DashboardSettings;
}

function Erc721Token({ token, inputAddress, openSeaProxyAddress, settings }: Props) {
  const [allowances, setAllowances] = useState<IERC721Allowance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { selectedChainId } = useEthereum();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const unlimitedAllowances = await getUnlimitedAllowancesFromApprovals(
        token.contract,
        inputAddress,
        token.approvalsForAll
      );
      const limitedAllowances = await getLimitedAllowancesFromApprovals(token.contract, token.approvals);
      const allAllowances = [...limitedAllowances, ...unlimitedAllowances].filter(
        (allowance) => allowance !== undefined
      );

      setAllowances(allAllowances);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="Token">
        <ClipLoader size={20} color={'#000'} loading={loading} />
      </div>
    );
  }

  const hasZeroBalance = token.balance === '0';
  const hasNoAllowances = allowances.length === 0;

  // Do not render tokens without balance or allowances
  if (hasZeroBalance && hasNoAllowances) return null;

  // Do not render ERC1155 tokens without allowances
  if (token.balance === 'ERC1155' && hasNoAllowances) return null;

  // Do not render tokens without allowances if that is the setting
  if (!settings.includeTokensWithoutAllowances && hasNoAllowances) return null;

  const onRevoke = (allowance: IERC721Allowance) => {
    const allowanceEquals = (a: IERC721Allowance, b: IERC721Allowance) =>
      a.spender === b.spender && a.tokenId === b.tokenId;

    setAllowances((previousAllowances) => previousAllowances.filter((other) => !allowanceEquals(other, allowance)));
  };

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

export default Erc721Token;
