import { Log } from '@ethersproject/abstract-provider';
import Token from 'components/Dashboard/Token';
import { Contract } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { ERC20 } from 'lib/abis';
import { useEthereum } from 'lib/hooks/useEthereum';
import { DashboardSettings, Erc20TokenData, TokenMapping } from 'lib/interfaces';
import { toFloat } from 'lib/utils';
import { getTokenData } from 'lib/utils/erc20';
import { getTokenIcon, isSpamToken, isVerifiedToken } from 'lib/utils/tokens';
import { useAsync } from 'react-async-hook';
import ClipLoader from 'react-spinners/ClipLoader';

interface Props {
  settings: DashboardSettings;
  transferEvents: Log[];
  approvalEvents: Log[];
  tokenMapping?: TokenMapping;
  inputAddress?: string;
}

function Erc20TokenList({ settings, transferEvents, approvalEvents, tokenMapping, inputAddress }: Props) {
  const { readProvider, selectedChainId } = useEthereum();

  const { result: tokens, loading } = useAsync<Erc20TokenData[]>(async () => {
    const filteredApprovalEvents = approvalEvents.filter((ev) => ev.topics.length === 3);
    const filteredTransferEvents = transferEvents.filter((ev) => ev.topics.length === 3);
    const allEvents = [...filteredApprovalEvents, ...filteredTransferEvents];

    // Filter unique token contract addresses and convert all events to Contract instances
    const tokenContracts = allEvents
      .filter((event, i) => i === allEvents.findIndex((other) => event.address === other.address))
      .map((event) => new Contract(getAddress(event.address), ERC20, readProvider));

    const unsortedTokens = await Promise.all(
      tokenContracts.map(async (contract) => {
        const tokenApprovals = approvalEvents.filter((approval) => approval.address === contract.address);
        const verified = isVerifiedToken(contract.address, tokenMapping);
        const icon = getTokenIcon(contract.address, selectedChainId, tokenMapping);

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

    return sortedTokens;
  }, []);

  if (loading) {
    return <ClipLoader css="margin: 10px;" size={40} color={'#000'} loading={loading} />;
  }

  if (tokens.length === 0) {
    return <div className="TokenList">No token balances</div>;
  }

  const hasZeroBalance = (token: Erc20TokenData) => toFloat(Number(token.balance), token.decimals) !== '0.000';

  const tokenComponents = tokens
    .filter((token) => !isSpamToken(token))
    .filter((token) => settings.includeUnverifiedTokens || token.verified)
    .filter((token) => settings.includeTokensWithoutBalances || hasZeroBalance(token))
    .map((token) => (
      <Token key={token.contract.address} token={token} inputAddress={inputAddress} settings={settings} />
    ));

  return <div className="TokenList">{tokenComponents}</div>;
}

export default Erc20TokenList;
