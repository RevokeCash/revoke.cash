import React, { useEffect, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import { useEthereum } from 'utils/hooks/useEthereum';
import { Erc20TokenData } from '../common/interfaces';
import { compareBN, getChainExplorerUrl, toFloat } from '../common/util';
import Erc20AllowanceList from './Erc20AllowanceList';
import Erc20TokenBalance from './Erc20TokenBalance';
import { Allowance } from './interfaces';
import { formatAllowance, getAllowancesFromApprovals } from './util';

interface Props {
  token: Erc20TokenData;
  inputAddress: string;
}

function Erc20Token({ token, inputAddress }: Props) {
  const [allowances, setAllowances] = useState<Allowance[]>([]);
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

  // Do not render tokens without balance or allowances
  const balanceString = toFloat(Number(token.balance), token.decimals);
  if (balanceString === '0.000' && allowances.length === 0) return null;

  if (loading) {
    return (
      <div className="Token">
        <ClipLoader size={20} color={'#000'} loading={loading} />
      </div>
    );
  }

  const explorerUrl = `${getChainExplorerUrl(selectedChainId)}/address/${token.contract.address}`;

  return (
    <div className="Token">
      <Erc20TokenBalance
        symbol={token.symbol}
        icon={token.icon}
        balance={token.balance}
        decimals={token.decimals}
        explorerUrl={explorerUrl}
      />
      <Erc20AllowanceList
        inputAddress={inputAddress}
        token={token}
        allowances={allowances}
        onRevoke={(spender) => {
          setAllowances((previousAllowances) =>
            previousAllowances.filter((allowance) => allowance.spender !== spender)
          );
        }}
      />
    </div>
  );
}

export default Erc20Token;
