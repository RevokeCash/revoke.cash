import type { Log } from '@ethersproject/abstract-provider';
import type { Contract, providers } from 'ethers';
import { BigNumber, utils } from 'ethers';
import { ERC721Metadata } from 'lib/abis';
import { ADDRESS_ZERO, MOONBIRDS_ADDRESS } from 'lib/constants';
import type { AllowanceData, BaseAllowanceData, BaseTokenData, LogsProvider, TokenMapping } from 'lib/interfaces';
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
  tokenMapping: TokenMapping,
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
        const tokenData = await getTokenData(contract, userAddress, tokenMapping, transfersFrom, transfersTo);
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
      ({ amount }) => formatErc20Allowance(amount, tokenData?.decimals, tokenData?.totalSupply) !== '0.000'
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

  const [amount, lastUpdated, transactionHash] = await Promise.all([
    convertString(unpackResult(multicallContract.functions.allowance(ownerAddress, spender))),
    multicallContract.provider.getBlock(approval.blockNumber).then((block) => block.timestamp),
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

    const [owner, spender, lastUpdated, transactionHash] = await Promise.all([
      unpackResult(multicallContract.functions.ownerOf(tokenId)),
      unpackResult(multicallContract.functions.getApproved(tokenId)),
      multicallContract.provider.getBlock(approval.blockNumber).then((block) => block.timestamp),
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

  const [isApprovedForAll, lastUpdated, transactionHash] = await Promise.all([
    unpackResult(multicallContract.functions.isApprovedForAll(ownerAddress, spender)),
    multicallContract.provider.getBlock(approval.blockNumber).then((block) => block.timestamp),
    approval.transactionHash,
  ]);

  if (!isApprovedForAll) return undefined;

  return { spender, lastUpdated, transactionHash };
};

export const formatErc20Allowance = (allowance: string, decimals: number, totalSupply: string): string => {
  const allowanceBN = BigNumber.from(allowance);
  const totalSupplyBN = BigNumber.from(totalSupply);

  if (allowanceBN.gt(totalSupplyBN)) {
    return 'Unlimited';
  }

  return toFloat(Number(allowanceBN), decimals);
};

export const getAllowanceI18nValues = (allowance: AllowanceData) => {
  if (!allowance.spender) {
    const i18nKey = 'dashboard:allowances.none';
    return { i18nKey };
  }

  if (allowance.amount) {
    const amount = formatErc20Allowance(allowance.amount, allowance.decimals, allowance.totalSupply);
    const i18nKey = amount === 'Unlimited' ? 'dashboard:allowances.unlimited' : 'dashboard:allowances.amount';
    const { symbol } = allowance;
    return { amount, i18nKey, symbol };
  }

  const i18nKey = allowance.tokenId === undefined ? 'dashboard:allowances.unlimited' : 'dashboard:allowances:token_id';
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

  const baseDummyEventLog = {
    blockNumber: 0,
    blockHash: '0x',
    transactionIndex: 0,
    removed: false,
    data: '0x',
    transactionHash: '0x',
    logIndex: 0,
  };

  return [
    {
      ...baseDummyEventLog,
      address: MOONBIRDS_ADDRESS,
      topics: [
        utils.id('ApprovalForAll(address,address,approved)'),
        utils.hexZeroPad(userAddress, 32),
        utils.hexZeroPad(openseaProxyAddress, 32),
      ],
    },
  ];
};
