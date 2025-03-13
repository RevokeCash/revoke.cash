import { ChainId } from '@revoke.cash/chains';
import { AGW_SESSIONS_ABI, ERC721_ABI, PERMIT2_ABI } from 'lib/abis';
import eventsDB from 'lib/databases/events';
import { getLogsProvider } from 'lib/providers';
import { sortTokenEventsChronologically } from 'lib/utils';
import { isNullish } from 'lib/utils';
import { addressToTopic, apiLogin } from 'lib/utils';
import { type DocumentedChainId, createViemPublicClientForChain, getChainName } from 'lib/utils/chains';
import { parseApprovalForAllLog, parseApprovalLog, parsePermit2Log, parseTransferLog } from 'lib/utils/events';
import { type TokenEvent, generatePatchedAllowanceEvents } from 'lib/utils/events';
import { type SessionCreatedEvent, parseSessionCreatedLog } from 'lib/utils/sessions';
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

const getEventPrerequisites = async (chainId: DocumentedChainId, address: Address) => {
  const chainName = getChainName(chainId);
  const publicClient = createViemPublicClientForChain(chainId);
  const logsProvider = getLogsProvider(chainId);
  const [openSeaProxy, fromBlock, toBlock, nonce, isLoggedIn] = await Promise.all([
    getOpenSeaProxyAddress(address),
    0,
    logsProvider.getLatestBlock(),
    publicClient.getTransactionCount({ address }),
    apiLogin(),
  ]);

  if (!isLoggedIn) {
    throw new Error('Failed to create an API session');
  }

  // If the address is an EOA and has no transactions, we can skip fetching events for efficiency. Note that all deployed contracts have a nonce of >= 1
  // See https://eips.ethereum.org/EIPS/eip-161
  if (nonce === 0) {
    console.log(`${chainName}: Skipping event fetching for EOA with no transactions (${address})`);
  }

  return { logsProvider, openSeaProxy, fromBlock, toBlock, nonce };
};

const getTokenEventsDefault = async (chainId: DocumentedChainId, address: Address): Promise<TokenEvent[]> => {
  const { openSeaProxy, logsProvider, fromBlock, toBlock, nonce } = await getEventPrerequisites(chainId, address);
  if (nonce === 0) return [];

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
    ...generatePatchedAllowanceEvents(address, openSeaProxy ?? undefined, [
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

export const getSessionEvents = async (
  chainId: DocumentedChainId,
  address: Address,
): Promise<SessionCreatedEvent[]> => {
  if (chainId !== ChainId.Abstract) {
    throw new Error('Sessions are only supported on Abstract');
  }

  const { logsProvider, fromBlock, toBlock, nonce } = await getEventPrerequisites(chainId, address);
  if (nonce === 0) return [];

  const eventSelector = toEventSelector(getAbiItem({ abi: AGW_SESSIONS_ABI, name: 'SessionCreated' }));
  const addressTopic = addressToTopic(address);

  const sessionEvents = await eventsDB.getLogs(
    logsProvider,
    { topics: [eventSelector, addressTopic], fromBlock, toBlock },
    chainId,
    'SessionCreated',
  );

  const parsedEvents = sessionEvents.map((log) => parseSessionCreatedLog(log, chainId));

  return parsedEvents;
};
