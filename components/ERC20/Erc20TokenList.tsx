import { Log } from '@ethersproject/abstract-provider';
import { Contract } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { useEffect, useState } from 'react';
import ClipLoader from 'react-spinners/ClipLoader';
import { useEthereum } from 'utils/hooks/useEthereum';
import { ERC20 } from '../common/abis';
import { Erc20TokenData, TokenMapping } from '../common/interfaces';
import { getTokenIcon, isVerified, toFloat } from '../common/util';
import Erc20Token from './Erc20Token';
import { getTokenData } from './util';

interface Props {
  filterUnverifiedTokens: boolean;
  filterZeroBalances: boolean;
  transferEvents: Log[];
  approvalEvents: Log[];
  tokenMapping?: TokenMapping;
  inputAddress?: string;
}

function Erc20TokenList({
  filterUnverifiedTokens,
  filterZeroBalances,
  transferEvents,
  approvalEvents,
  tokenMapping,
  inputAddress,
}: Props) {
  const [tokens, setTokens] = useState<Erc20TokenData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { provider, chainId } = useEthereum();

  useEffect(() => {
    loadData();
  }, [inputAddress, provider]);

  const loadData = async () => {
    if (!inputAddress) return;
    if (!provider) return;

    setLoading(true);

    const filteredApprovalEvents = approvalEvents.filter((ev) => ev.topics.length === 3);
    const filteredTransferEvents = transferEvents.filter((ev) => ev.topics.length === 3);
    const allEvents = [...filteredApprovalEvents, ...filteredTransferEvents];

    // Filter unique token contract addresses and convert all events to Contract instances
    const tokenContracts = allEvents
      .filter((event, i) => i === allEvents.findIndex((other) => event.address === other.address))
      .map((event) => new Contract(getAddress(event.address), ERC20, provider));

    const unsortedTokens = await Promise.all(
      tokenContracts.map(async (contract) => {
        const tokenApprovals = approvalEvents.filter((approval) => approval.address === contract.address);
        const verified = isVerified(contract.address, tokenMapping);
        const icon = getTokenIcon(contract.address, chainId, tokenMapping);

        try {
          const tokenData = await getTokenData(contract, inputAddress, tokenMapping);
          return { ...tokenData, icon, contract, verified, approvals: tokenApprovals };
        } catch {
          // If the call to getTokenData() fails, the token is not an ERC20 token so
          // we do not include it in the token list (should not happen).
          return undefined;
        }
      })
    );

    const hasBalanceOrApprovals = (token: Erc20TokenData) =>
      token.approvals.length > 0 || toFloat(Number(token.balance), token.decimals) !== '0.000';

    // Filter undefined tokens, filter tokens without balance or approvals
    //  and sort tokens alphabetically on token symbol
    const sortedTokens = unsortedTokens
      .filter((token) => token !== undefined)
      .filter(hasBalanceOrApprovals)
      .sort((a: any, b: any) => a.symbol.localeCompare(b.symbol));

    setTokens(sortedTokens);
    setLoading(false);
  };

  if (loading) {
    return <ClipLoader css="margin: 10px;" size={40} color={'#000'} loading={loading} />;
  }

  if (tokens.length === 0) {
    return <div className="TokenList">No token balances</div>;
  }

  const tokenComponents = tokens
    .filter((token) => !filterUnverifiedTokens || token.verified)
    .filter((token) => !filterZeroBalances || !(toFloat(Number(token.balance), token.decimals) === '0.000'))
    .map((token) => <Erc20Token key={token.contract.address} token={token} inputAddress={inputAddress} />);

  return <div className="TokenList">{tokenComponents}</div>;
}

export default Erc20TokenList;
