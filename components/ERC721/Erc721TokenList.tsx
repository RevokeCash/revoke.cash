import { Log } from '@ethersproject/abstract-provider';
import { Contract } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { ERC721Metadata } from 'lib/abis';
import { useAppContext } from 'lib/hooks/useAppContext';
import { useEthereum } from 'lib/hooks/useEthereum';
import { Erc721TokenData } from 'lib/interfaces';
import { generatePatchedAllowanceEvents } from 'lib/utils/erc721';
import { getErc721TokenData, getTokenIcon, isSpamToken } from 'lib/utils/tokens';
import { useAsync } from 'react-async-hook';
import ClipLoader from 'react-spinners/ClipLoader';
import Token from '../Dashboard/Token';

interface Props {
  transferEvents: Log[];
  approvalEvents: Log[];
  approvalForAllEvents: Log[];
}

function Erc721TokenList({ transferEvents, approvalEvents, approvalForAllEvents }: Props) {
  const { readProvider } = useEthereum();
  const { inputAddress, openSeaProxyAddress, tokenMapping, settings } = useAppContext();

  const { result: tokens, loading } = useAsync<Erc721TokenData[]>(async () => {
    const patchedApprovalForAllEvents = [
      ...approvalForAllEvents,
      ...generatePatchedAllowanceEvents(inputAddress, openSeaProxyAddress, [
        ...approvalEvents,
        ...approvalForAllEvents,
        ...transferEvents,
      ]),
    ];

    const filteredApprovalEvents = approvalEvents.filter((ev) => ev.topics.length === 4);
    const filteredTransferEvents = transferEvents.filter((ev) => ev.topics.length === 4);

    const allEvents = [...filteredApprovalEvents, ...patchedApprovalForAllEvents, ...filteredTransferEvents];

    // Filter unique token contract addresses and convert all events to Contract instances
    const tokenContracts = allEvents
      .filter((event, i) => i === allEvents.findIndex((other) => event.address === other.address))
      .map((event) => new Contract(getAddress(event.address), ERC721Metadata, readProvider));

    // Look up token data for all tokens, add their lists of approvals
    const unsortedTokens = await Promise.all(
      tokenContracts.map(async (contract) => {
        const approvalsForAll = patchedApprovalForAllEvents.filter((approval) => approval.address === contract.address);
        const approvals = approvalEvents.filter((approval) => approval.address === contract.address);
        const icon = getTokenIcon(contract.address, undefined, tokenMapping);

        // Skip verification checks for NFTs
        const verified = true;

        try {
          const tokenData = await getErc721TokenData(contract, inputAddress, tokenMapping);
          return { ...tokenData, icon, contract, verified, approvals, approvalsForAll };
        } catch {
          // If the call to getTokenData() fails, the token is not an ERC721 token so
          // we do not include it in the token list.
          return undefined;
        }
      })
    );

    // Filter undefined tokens and sort tokens alphabetically on token symbol
    const sortedTokens = unsortedTokens
      .filter((token) => token !== undefined)
      .sort((a: any, b: any) => a.symbol.localeCompare(b.symbol));

    return sortedTokens;
  }, []);

  if (loading) {
    return <ClipLoader css="margin: 10px;" size={40} color={'#000'} loading={loading} />;
  }

  if (tokens.length === 0) {
    return <div className="TokenList">No token balances</div>;
  }

  const tokenComponents = tokens
    .filter((token) => !isSpamToken(token))
    .filter((token) => settings.includeUnverifiedTokens || token.verified)
    .filter((token) => settings.includeTokensWithoutBalances || token.balance !== '0')
    .map((token) => <Token key={token.contract.address} token={token} />);

  return <div className="TokenList">{tokenComponents}</div>;
}

export default Erc721TokenList;
