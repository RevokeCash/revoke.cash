import type { Log } from '@ethersproject/abstract-provider';
import Error from 'components/common/Error';
import { ERC20, ERC721Metadata } from 'lib/abis';
import { useAppContext } from 'lib/hooks/useAppContext';
import { useEthereum } from 'lib/hooks/useEthereum';
import type { TokenData, TokenStandard } from 'lib/interfaces';
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

const TokenList = ({ tokenStandard, transferEvents, approvalEvents, approvalForAllEvents }: Props) => {
  const { readProvider } = useEthereum();
  const { inputAddress, tokenMapping, settings } = useAppContext();

  const {
    result: tokens,
    loading,
    error,
  } = useAsync<TokenData[]>(async () => {
    const expectedTopics = tokenStandard === 'ERC20' ? 3 : 4;
    const filteredApprovalEvents = approvalEvents.filter((ev) => ev.topics.length === expectedTopics);
    const filteredTransferEvents = transferEvents.filter((ev) => ev.topics.length === expectedTopics);

    const allEvents = [...filteredTransferEvents, ...filteredApprovalEvents, ...approvalForAllEvents];
    const contracts = createTokenContracts(allEvents, tokenStandard === 'ERC20' ? ERC20 : ERC721Metadata, readProvider);

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

    return sortedTokens;
  }, [tokenStandard]);

  if (loading) {
    return (
      <div className="flex justify-center">
        <ClipLoader size={40} color={'#000'} loading={loading} />
      </div>
    );
  }

  if (error) return <Error error={error} />;

  if (tokens.length === 0) {
    return <div>No token balances</div>;
  }

  const tokenComponents = tokens
    .filter((token) => !isSpamToken(token))
    .filter((token) => settings.includeUnverifiedTokens || token.verified)
    .filter((token) => settings.includeTokensWithoutBalances || !hasZeroBalance(token))
    .map((token) => <Token key={token.contract.address} token={token} />);

  return <div>{tokenComponents}</div>;
};

export default TokenList;
