import type { Contract, providers } from 'ethers';
import { BigNumber, utils } from 'ethers';
import { ERC721Metadata } from 'lib/abis';
import { ADDRESS_ZERO, MOONBIRDS_ADDRESS } from 'lib/constants';
import type { AllowanceData, BaseAllowanceData, BaseTokenData, Log, LogsProvider } from 'lib/interfaces';
import {
  deduplicateLogsByTopics,
  filterLogsByAddress,
  getLogs,
  sortLogsChronologically,
  toFloat,
  topicToAddress,
} from '.';
import { convertString, unpackResult } from './promises';
import { createTokenContracts, getTokenData, hasZeroBalance, isErc721Contract, isSpamToken } from './tokens';

export const getAllowancesForAddress = async (
  userAddress: string,
  logsProvider: LogsProvider,
  readProvider: providers.Provider,
  chainId: number,
  openSeaProxyAddress?: string
): Promise<AllowanceData[]> => {
  const latestBlockNumber = await readProvider.getBlockNumber();

  const buildGetEventsFunction = (name: string, addressTopicIndex: number) => {
    const erc721Interface = new utils.Interface(ERC721Metadata);
    const expectedTopic0 = erc721Interface.getEventTopic(name);

    return async (userAddress: string, latestBlockNumber: number): Promise<Log[]> => {
      if (!userAddress || !logsProvider || !latestBlockNumber) return undefined;

      // Start with an array of undefined topic strings and add the event topic + address topic to the right spots
      const filter = { topics: [undefined, undefined, undefined] };
      filter.topics[0] = expectedTopic0;
      filter.topics[addressTopicIndex] = utils.hexZeroPad(userAddress, 32);

      const events = await getLogs(logsProvider, filter, 0, latestBlockNumber);
      console.log(`${name} events`, events);
      return events;
    };
  };

  const [transferFromEvents, transferToEvents, approvalEvents, unpatchedApprovalForAllEvents] = await Promise.all([
    buildGetEventsFunction('Transfer', 1)(userAddress, latestBlockNumber),
    buildGetEventsFunction('Transfer', 2)(userAddress, latestBlockNumber),
    buildGetEventsFunction('Approval', 1)(userAddress, latestBlockNumber),
    buildGetEventsFunction('ApprovalForAll', 1)(userAddress, latestBlockNumber),
  ]);

  // Manually patch the ApprovalForAll events
  const approvalForAllEvents = [
    ...unpatchedApprovalForAllEvents,
    ...generatePatchedAllowanceEvents(userAddress, openSeaProxyAddress, [
      ...approvalEvents,
      ...unpatchedApprovalForAllEvents,
      ...transferFromEvents,
      ...transferToEvents,
    ]),
  ];

  const allEvents = [...transferToEvents, ...approvalEvents, ...approvalForAllEvents];
  const contracts = createTokenContracts(allEvents, readProvider);

  // Look up token data for all tokens, add their lists of approvals
  const allowances = await Promise.all(
    contracts.map(async (contract) => {
      const approvalsForAll = filterLogsByAddress(approvalForAllEvents, contract.address);
      const approvals = filterLogsByAddress(approvalEvents, contract.address);
      const transfersFrom = filterLogsByAddress(transferFromEvents, contract.address);
      const transfersTo = filterLogsByAddress(transferToEvents, contract.address);

      try {
        const tokenData = await getTokenData(contract, userAddress, transfersFrom, transfersTo, chainId);
        const allowances = await getAllowancesForToken(contract, approvals, approvalsForAll, userAddress, tokenData);

        if (allowances.length === 0) {
          return [tokenData as AllowanceData];
        }

        const fullAllowances = allowances.map((allowance) => ({ ...tokenData, ...allowance }));
        return fullAllowances;
      } catch (e) {
        console.error(e);
        // If the call to getTokenData() fails, the token is not a standard-adhering token so
        // we do not include it in the token list.
        return [];
      }
    })
  );

  // Filter out any spam tokens and zero-balance + zero-allowance tokens
  return allowances
    .flat()
    .filter((allowance) => !isSpamToken(allowance))
    .filter((allowance) => allowance.spender || !hasZeroBalance(allowance))
    .filter((allowance) => allowance.spender || allowance.balance !== 'ERC1155')
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
};

export const getAllowancesForToken = async (
  contract: Contract,
  approvalEvents: Log[],
  approvalForAllEvents: Log[],
  userAddress: string,
  tokenData: BaseTokenData
): Promise<BaseAllowanceData[]> => {
  if (isErc721Contract(contract)) {
    const unlimitedAllowances = await getUnlimitedErc721AllowancesFromApprovals(
      contract,
      userAddress,
      approvalForAllEvents
    );
    const limitedAllowances = await getLimitedErc721AllowancesFromApprovals(contract, approvalEvents);

    const allowances = [...limitedAllowances, ...unlimitedAllowances].filter((allowance) => !!allowance);

    return allowances;
  } else {
    // Filter out zero-value allowances
    const allowances = (await getErc20AllowancesFromApprovals(contract, userAddress, approvalEvents)).filter(
      ({ amount }) => formatErc20Allowance(amount, tokenData?.decimals, tokenData?.totalSupply) !== '0'
    );

    return allowances;
  }
};

export const getErc20AllowancesFromApprovals = async (contract: Contract, ownerAddress: string, approvals: Log[]) => {
  const sortedApprovals = sortLogsChronologically(approvals).reverse();
  const deduplicatedApprovals = deduplicateLogsByTopics(sortedApprovals);

  const allowances = await Promise.all(
    deduplicatedApprovals.map((approval) => getErc20AllowanceFromApproval(contract, ownerAddress, approval))
  );

  return allowances;
};

const getErc20AllowanceFromApproval = async (multicallContract: Contract, ownerAddress: string, approval: Log) => {
  const spender = topicToAddress(approval.topics[2]);
  const lastApprovedAmount = BigNumber.from(approval.data);

  // If the most recent approval event was for 0, then we know for sure that the allowance is 0
  // If not, we need to check the current allowance because we cannot determine the allowance from the event
  // since it may have been partially used (through transferFrom)
  if (lastApprovedAmount.isZero()) {
    return { spender, amount: '0', lastUpdated: 0, transactionHash: approval.transactionHash };
  }

  const [amount, lastUpdated, transactionHash] = await Promise.all([
    convertString(unpackResult(multicallContract.functions.allowance(ownerAddress, spender))),
    approval.timestamp ?? multicallContract.provider.getBlock(approval.blockNumber).then((block) => block.timestamp),
    approval.transactionHash,
  ]);

  return { spender, amount, lastUpdated, transactionHash };
};

export const getLimitedErc721AllowancesFromApprovals = async (contract: Contract, approvals: Log[]) => {
  const sortedApprovals = sortLogsChronologically(approvals).reverse();
  const deduplicatedApprovals = deduplicateLogsByTopics(sortedApprovals);

  const allowances = await Promise.all(
    deduplicatedApprovals.map((approval) => getLimitedErc721AllowanceFromApproval(contract, approval))
  );

  return allowances;
};

const getLimitedErc721AllowanceFromApproval = async (multicallContract: Contract, approval: Log) => {
  // Wrap this in a try-catch since it's possible the NFT has been burned
  try {
    // Some contracts (like CryptoStrikers) may not implement ERC721 correctly
    // by making tokenId a non-indexed parameter, in which case it needs to be
    // taken from the event data rather than topics
    const tokenIdEncoded = approval.topics.length === 4 ? approval.topics[3] : approval.data;
    const tokenId = BigNumber.from(tokenIdEncoded).toString();
    const lastApproved = topicToAddress(approval.topics[2]);

    // If the most recent approval was a REVOKE, we know for sure that the allowance is revoked
    // If not, we need to check the current allowance because we cannot determine the allowance from the event
    // since it may have been "revoked" by transferring the NFT to another address
    // TODO: We can probably join Approve and Transfer events to get the actual approved status from just events
    if (lastApproved === ADDRESS_ZERO) {
      return undefined;
    }

    const [owner, spender, lastUpdated, transactionHash] = await Promise.all([
      unpackResult(multicallContract.functions.ownerOf(tokenId)),
      unpackResult(multicallContract.functions.getApproved(tokenId)),
      approval.timestamp ?? multicallContract.provider.getBlock(approval.blockNumber).then((block) => block.timestamp),
      approval.transactionHash,
    ]);

    const expectedOwner = topicToAddress(approval.topics[1]);
    if (spender === ADDRESS_ZERO || owner !== expectedOwner) return undefined;

    return { spender, tokenId, lastUpdated, transactionHash };
  } catch {
    return undefined;
  }
};

export const getUnlimitedErc721AllowancesFromApprovals = async (
  contract: Contract,
  ownerAddress: string,
  approvals: Log[]
) => {
  const sortedApprovals = sortLogsChronologically(approvals).reverse();
  const deduplicatedApprovals = deduplicateLogsByTopics(sortedApprovals);

  const allowances = await Promise.all(
    deduplicatedApprovals.map((approval) => getUnlimitedErc721AllowanceFromApproval(contract, ownerAddress, approval))
  );

  return allowances;
};

const getUnlimitedErc721AllowanceFromApproval = async (
  multicallContract: Contract,
  ownerAddress: string,
  approval: Log
) => {
  const spender = topicToAddress(approval.topics[2]);

  // For ApprovalForAll events, we can determine the allowance (true/false) from *only* the event
  // so we do not have to check the chain for the current allowance
  const isApprovedForAll = approval.data !== '0x' && !BigNumber.from(approval.data).isZero();

  // If the allwoance if already revoked, we dont need to make any more requests
  if (!isApprovedForAll) return undefined;

  const [lastUpdated, transactionHash] = await Promise.all([
    approval.timestamp ?? multicallContract.provider.getBlock(approval.blockNumber).then((block) => block.timestamp),
    approval.transactionHash,
  ]);

  return { spender, lastUpdated, transactionHash };
};

export const formatErc20Allowance = (allowance: string, decimals: number, totalSupply: string): string => {
  const allowanceBN = BigNumber.from(allowance);
  const totalSupplyBN = BigNumber.from(totalSupply);

  if (allowanceBN.gt(totalSupplyBN)) {
    return 'Unlimited';
  }

  return toFloat(allowanceBN, decimals);
};

export const getAllowanceI18nValues = (allowance: AllowanceData) => {
  if (!allowance.spender) {
    const i18nKey = 'address:allowances.none';
    return { i18nKey };
  }

  if (allowance.amount) {
    const amount = formatErc20Allowance(allowance.amount, allowance.decimals, allowance.totalSupply);
    const i18nKey = amount === 'Unlimited' ? 'address:allowances.unlimited' : 'address:allowances.amount';
    const { symbol } = allowance;
    return { amount, i18nKey, symbol };
  }

  const i18nKey = allowance.tokenId === undefined ? 'address:allowances.unlimited' : 'address:allowances:token_id';
  const { tokenId } = allowance;
  return { tokenId, i18nKey };
};

// This function is a hardcoded patch to show Moonbirds' OpenSea allowances,
// which do not show up normally because of a bug in their contract
export const generatePatchedAllowanceEvents = (
  userAddress: string,
  openseaProxyAddress?: string,
  allEvents: Log[] = []
): Log[] => {
  if (!userAddress || !openseaProxyAddress) return [];

  // Only add the Moonbirds approval event if the account has interacted with Moonbirds at all
  if (!allEvents.some((ev) => ev.address === MOONBIRDS_ADDRESS)) return [];

  return [
    {
      // We use the deployment transaction hash as a placeholder for the approval transaction hash
      transactionHash: '0xd4547dc336dd4a0655f11267537964d7641f115ef3d5440d71514e3efba9d210',
      blockNumber: 14591056,
      transactionIndex: 145,
      logIndex: 0,
      address: MOONBIRDS_ADDRESS,
      topics: [
        utils.id('ApprovalForAll(address,address,bool)'),
        utils.hexZeroPad(userAddress, 32).toLowerCase(),
        utils.hexZeroPad(openseaProxyAddress, 32).toLowerCase(),
      ],
      data: '0x1',
      timestamp: 1649997510,
    },
  ];
};
