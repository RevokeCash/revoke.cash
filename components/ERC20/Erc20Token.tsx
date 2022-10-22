import TokenBalance from 'components/Dashboard/TokenBalance';
import { useEthereum } from 'lib/hooks/useEthereum';
import { DashboardSettings, Erc20TokenData, IERC20Allowance } from 'lib/interfaces';
import { compareBN, toFloat } from 'lib/utils';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { formatAllowance, getAllowancesFromApprovals } from 'lib/utils/erc20';
import React, { useEffect, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import Erc20AllowanceList from './Erc20AllowanceList';

interface Props {
  token: Erc20TokenData;
  inputAddress: string;
  settings: DashboardSettings;
}

function Erc20Token({ token, inputAddress, settings }: Props) {
  const [allowances, setAllowances] = useState<IERC20Allowance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { selectedChainId } = useEthereum();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Filter out zero-value allowances and sort from high to low
      const loadedAllowances = (await getAllowancesFromApprovals(token.contract, inputAddress, token.approvals))
        .filter(({ allowance }) => formatAllowance(allowance, token.decimals, token.totalSupply) !== '0.000')
        .sort((a, b) => -1 * compareBN(a.allowance, b.allowance));

      setAllowances(loadedAllowances);
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

  const hasZeroBalance = toFloat(Number(token.balance), token.decimals) === '0.000';
  const hasNoAllowances = allowances.length === 0;

  // Do not render tokens without balance or allowances
  if (hasZeroBalance && hasNoAllowances) return null;

  // Do not render tokens without allowances if that is the setting
  if (!settings.includeTokensWithoutAllowances && hasNoAllowances) return null;

  const explorerUrl = `${getChainExplorerUrl(selectedChainId)}/address/${token.contract.address}`;

  const onRevoke = (spender: string) => {
    setAllowances((previousAllowances) => previousAllowances.filter((allowance) => allowance.spender !== spender));
  };

  return (
    <div className="Token">
      <TokenBalance
        symbol={token.symbol}
        icon={token.icon}
        balance={token.balance}
        decimals={token.decimals}
        explorerUrl={explorerUrl}
      />
      <Erc20AllowanceList inputAddress={inputAddress} token={token} allowances={allowances} onRevoke={onRevoke} />
    </div>
  );
}

export default Erc20Token;
