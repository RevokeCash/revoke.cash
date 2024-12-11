import { ERC721_ABI, PERMIT2_ABI } from 'lib/abis';
import eventsDB from 'lib/databases/events';
import { getLogsProvider } from 'lib/providers';
import { sortTokenEventsChronologically } from 'lib/utils';
import { isNullish } from 'lib/utils';
import { addressToTopic, apiLogin } from 'lib/utils';
import { type DocumentedChainId, createViemPublicClientForChain } from 'lib/utils/chains';
import { parseApprovalForAllLog, parseApprovalLog, parsePermit2Log, parseTransferLog } from 'lib/utils/events';
import { type TokenEvent, generatePatchedAllowanceEvents } from 'lib/utils/events';
import { getOpenSeaProxyAddress } from 'lib/utils/whois';
import { type Address, getAbiItem, toEventSelector } from 'viem';

// Note: ideally I would have included this in the 'Chain' class, but this causes circular dependency issues nd issues with Edge runtime
// So we use this separate file instead to configure token event getting per chain.

export const getTokenEvents = async (chainId: DocumentedChainId, address: Address): Promise<TokenEvent[]> => {
  const override = ChainOverrides[chainId];
  if (override) return override(chainId, address);
  return getTokenEventsDefault(chainId, address);
};

type TokenEventsGetter = (chainId: DocumentedChainId, address: Address) => Promise<TokenEvent[]>;

const ChainOverrides: Record<number, TokenEventsGetter> = {};

const getTokenEventsDefault = async (chainId: DocumentedChainId, address: Address): Promise<TokenEvent[]> => {
  // Assemble prerequisites

  const publicClient = createViemPublicClientForChain(chainId);
  const logsProvider = getLogsProvider(chainId);

  const [openSeaProxyAddress, fromBlock, toBlock, isLoggedIn] = await Promise.all([
    getOpenSeaProxyAddress(address),
    0,
    publicClient.getBlockNumber().then((blockNumber) => Number(blockNumber)),
    apiLogin(),
  ]);

  if (!isLoggedIn) {
    throw new Error('Failed to create an API session');
  }

  // Create required event filters

  const getErc721EventSelector = (eventName: 'Transfer' | 'Approval' | 'ApprovalForAll') => {
    return toEventSelector(getAbiItem({ abi: ERC721_ABI, name: eventName }));
  };

  const getPermit2EventSelector = (eventName: 'Permit' | 'Approval' | 'Lockdown') => {
    return toEventSelector(getAbiItem({ abi: PERMIT2_ABI, name: eventName }));
  };

  const addressTopic = addressToTopic(address);

  const transferToFilter = { topics: [getErc721EventSelector('Transfer'), null, addressTopic], fromBlock, toBlock };
  const transferFromFilter = { topics: [getErc721EventSelector('Transfer'), addressTopic], fromBlock, toBlock };
  const approvalFilter = { topics: [getErc721EventSelector('Approval'), addressTopic], fromBlock, toBlock };
  const approvalForAllFilter = {
    topics: [getErc721EventSelector('ApprovalForAll'), addressTopic],
    fromBlock,
    toBlock,
  };

  const permit2ApprovalFilter = { topics: [getPermit2EventSelector('Approval'), addressTopic], fromBlock, toBlock };
  const permit2PermitFilter = { topics: [getPermit2EventSelector('Permit'), addressTopic], fromBlock, toBlock };
  const permit2LockdownFilter = { topics: [getPermit2EventSelector('Lockdown'), addressTopic], fromBlock, toBlock };

  // Fetch events
  const [transferTo, transferFrom, approval, approvalForAllUnpatched, permit2Approval, permit2Permit, permit2Lockdown] =
    await Promise.all([
      eventsDB.getLogs(logsProvider, transferToFilter, chainId, 'Transfer (to)'),
      eventsDB.getLogs(logsProvider, transferFromFilter, chainId, 'Transfer (from)'),
      eventsDB.getLogs(logsProvider, approvalFilter, chainId, 'Approval'),
      eventsDB.getLogs(logsProvider, approvalForAllFilter, chainId, 'ApprovalForAll'),
      eventsDB.getLogs(logsProvider, permit2ApprovalFilter, chainId, 'Permit2 Approval'),
      eventsDB.getLogs(logsProvider, permit2PermitFilter, chainId, 'Permit2 Permit'),
      eventsDB.getLogs(logsProvider, permit2LockdownFilter, chainId, 'Permit2 Lockdown'),
    ]);

  // Manually patch the ApprovalForAll events
  const approvalForAll = [
    ...approvalForAllUnpatched,
    ...generatePatchedAllowanceEvents(address, openSeaProxyAddress ?? undefined, [
      ...approval,
      ...approvalForAllUnpatched,
      ...transferFrom,
      ...transferTo,
    ]),
  ];

  // Parse events. We put ApprovalForAll first to ensure that incorrect ERC721 contracts like CryptoStrikers are handled correctly
  const parsedEvents = [
    ...approvalForAll.map((log) => parseApprovalForAllLog(log, chainId)),
    ...approval.map((log) => parseApprovalLog(log, chainId)),
    ...permit2Approval.map((log) => parsePermit2Log(log, chainId)),
    ...permit2Permit.map((log) => parsePermit2Log(log, chainId)),
    ...permit2Lockdown.map((log) => parsePermit2Log(log, chainId)),
    ...transferFrom.map((log) => parseTransferLog(log, chainId, address)),
    ...transferTo.map((log) => parseTransferLog(log, chainId, address)),
  ];

  // We sort the events in reverse chronological order to ensure that the most recent events are processed first
  return sortTokenEventsChronologically(parsedEvents.filter((event) => !isNullish(event))).reverse();
};
