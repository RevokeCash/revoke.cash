import { Log } from '@ethersproject/abstract-provider';
import { ERC20, ERC721Metadata } from 'lib/abis';
import { useAppContext } from 'lib/hooks/useAppContext';
import { useEthereum } from 'lib/hooks/useEthereum';
import { TokenData, TokenStandard } from 'lib/interfaces';
import { getChainName } from 'lib/utils/chains';
import {
  createTokenContracts,
  getErc20TokenData,
  getErc721TokenData,
  getTokenIcon,
  hasZeroBalance,
  isSpamToken,
  isVerifiedToken,
} from 'lib/utils/tokens';
import { useAsync } from 'react-async-hook';
import ClipLoader from 'react-spinners/ClipLoader';
import Token from './Token';

interface Props {
  tokenStandard: TokenStandard;
  transferEvents: Log[];
  approvalEvents: Log[];
  approvalForAllEvents: Log[];
}

function TokenList({ tokenStandard, transferEvents, approvalEvents, approvalForAllEvents }: Props) {
  const { readProvider, selectedChainId } = useEthereum();
  const { inputAddress, openSeaProxyAddress, tokenMapping, settings } = useAppContext();

  const {
    result: tokens,
    loading,
    error,
  } = useAsync<TokenData[]>(async () => {
    //   console.log('HELOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO')
    const expectedTopics = tokenStandard === 'ERC20' ? 3 : 4;
    const filteredApprovalEvents = approvalEvents.filter((ev) => ev.topics.length === expectedTopics);
    const filteredTransferEvents = transferEvents.filter((ev) => ev.topics.length === expectedTopics);

    const allEvents = [...filteredTransferEvents, ...filteredApprovalEvents, ...approvalForAllEvents];
    const contracts = createTokenContracts(allEvents, tokenStandard === 'ERC20' ? ERC20 : ERC721Metadata, readProvider);
    console.log('all', contracts);

    // Look up token data for all tokens, add their lists of approvals
    const unsortedTokens = await Promise.all(
      contracts.map(async (contract) => {
        const approvalsForAll = approvalForAllEvents?.filter((approval) => approval.address === contract.address);
        const approvals = approvalEvents.filter((approval) => approval.address === contract.address);
        const icon = getTokenIcon(contract.address, tokenMapping);

        // Skip verification checks for NFTs
        const verified = tokenStandard === 'ERC20' ? isVerifiedToken(contract.address, tokenMapping) : true;

        try {
          if (tokenStandard === 'ERC20') {
            const baseTokenData = await getErc20TokenData(contract, inputAddress, tokenMapping);
            return { ...baseTokenData, icon, contract, verified, approvals };
          } else {
            const baseTokenData = await getErc721TokenData(contract, inputAddress, tokenMapping);
            return { ...baseTokenData, icon, contract, verified, approvals, approvalsForAll };
          }
        } catch {
          // If the call to getTokenData() fails, the token is not a standard-adhering token so
          // we do not include it in the token list.
          return undefined;
        }
      })
    );

    // Filter undefined tokens and sort tokens alphabetically on token symbol
    const sortedTokens = unsortedTokens
      .filter((token) => token !== undefined)
      .sort((a: any, b: any) => a.symbol.localeCompare(b.symbol));

    console.log('sorted', sortedTokens);

    return sortedTokens;
    // return []
  }, [tokenStandard]);

  if (loading) {
    return <ClipLoader css="margin: 10px;" size={40} color={'#000'} loading={loading} />;
  }

  if (error) {
    console.log(error);
    const message = error.message.includes('missing response')
      ? `Could not connect to the ${getChainName(selectedChainId)} chain`
      : error.message;
    return <div style={{ marginTop: '20px' }}>Error: {message}</div>;
  }

  if (tokens.length === 0) {
    return <div className="TokenList">No token balances</div>;
  }

  const tokenComponents = tokens
    .filter((token) => !isSpamToken(token))
    .filter((token) => settings.includeUnverifiedTokens || token.verified)
    .filter((token) => settings.includeTokensWithoutBalances || hasZeroBalance(token))
    .map((token) => <Token key={token.contract.address} token={token} />);

  return <div className="TokenList">{tokenComponents}</div>;
}

export default TokenList;
