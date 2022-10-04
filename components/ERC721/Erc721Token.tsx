import TokenBalance from 'components/Dashboard/TokenBalance';
import { useEthereum } from 'lib/hooks/useEthereum';
import { Erc721TokenData, IERC721Allowance } from 'lib/interfaces';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { getLimitedAllowancesFromApprovals, getUnlimitedAllowancesFromApprovals } from 'lib/utils/erc721';
import React, { useEffect, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import Erc721AllowanceList from './Erc721AllowanceList';

interface Props {
  token: Erc721TokenData;
  inputAddress: string;
  openSeaProxyAddress?: string;
}

function Erc721Token({ token, inputAddress, openSeaProxyAddress }: Props) {
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

  // // Do not render tokens without balance or allowances
  if (token.balance === '0' && allowances.length === 0) return null;

  // // Do not render ERC1155 tokens without allowances
  if (token.balance === 'ERC1155' && allowances.length === 0) return null;

  if (loading) {
    return (
      <div className="Token">
        <ClipLoader size={20} color={'#000'} loading={loading} />
      </div>
    );
  }

  const onRevoke = (allowance: IERC721Allowance) => {
    const allowanceEquals = (a: IERC721Allowance, b: IERC721Allowance) =>
      a.spender === b.spender && a.tokenId === b.tokenId;

    setAllowances((previousAllowances) => previousAllowances.filter((other) => !allowanceEquals(other, allowance)));
  };

  const explorerUrl = `${getChainExplorerUrl(selectedChainId)}/address/${token.contract.address}`;

  return (
    <div className="Token">
      <TokenBalance symbol={token.symbol} icon={token.icon} balance={token.balance} explorerUrl={explorerUrl} />
      <Erc721AllowanceList
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
