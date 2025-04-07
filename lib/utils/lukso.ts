import { LSP7_ABI, LSP8_ABI } from 'lib/abis';
import blocksDB from 'lib/databases/blocks';
import eventsDB from 'lib/databases/events';
import type { LogsProvider } from 'lib/providers';
import {
  type Address,
  type WalletClient,
  type WriteContractParameters,
  decodeEventLog,
  fromHex,
  getAbiItem,
  keccak256,
  toEventSelector,
  toHex,
} from 'viem';
import {
  addressToTopic,
  deduplicateArray,
  isNullish,
  sortTokenEventsChronologically,
  waitForTransactionConfirmation,
  writeContractUnlessExcessiveGas,
} from '.';
import {
  AllowanceType,
  type Lsp7Allowance,
  type Lsp8Allowance,
  type OnUpdate,
  type TokenAllowanceData,
} from './allowances';
import {
  type Log,
  type Lsp7ApprovalEvent,
  type Lsp7TransferEvent,
  type Lsp8ApprovalEvent,
  type Lsp8TransferEvent,
  type TokenEvent,
  TokenEventType,
} from './events';
import { parseFixedPointBigInt } from './formatting';
import { withFallback } from './promises';
import {
  type Lsp7TokenContract,
  type Lsp8TokenContract,
  type TokenData,
  getTokenDataFromMapping,
  throwIfSpam,
} from './tokens';

export const getLuksoEvents = async (
  chainId: number,
  address: Address,
  fromBlock: number,
  toBlock: number,
  logsProvider: LogsProvider,
) => {
  const [lsp7Events, lsp8Events] = await Promise.all([
    getLsp7Events(chainId, address, fromBlock, toBlock, logsProvider),
    getLsp8Events(chainId, address, fromBlock, toBlock, logsProvider),
  ]);

  return [...lsp7Events, ...lsp8Events];
};

export const getLsp7Events = async (
  chainId: number,
  address: Address,
  fromBlock: number,
  toBlock: number,
  logsProvider: LogsProvider,
) => {
  const getLsp7EventSelector = (eventName: 'Transfer' | 'OperatorAuthorizationChanged' | 'OperatorRevoked') => {
    return toEventSelector(getAbiItem({ abi: LSP7_ABI, name: eventName }));
  };

  const addressTopic = addressToTopic(address);

  const transferToFilter = { topics: [getLsp7EventSelector('Transfer'), null, null, addressTopic], fromBlock, toBlock };
  const transferFromFilter = { topics: [getLsp7EventSelector('Transfer'), null, addressTopic], fromBlock, toBlock };
  const operatorAuthorizationChangedFilter = {
    topics: [getLsp7EventSelector('OperatorAuthorizationChanged'), null, addressTopic],
    fromBlock,
    toBlock,
  };
  const operatorRevokedFilter = {
    topics: [getLsp7EventSelector('OperatorRevoked'), null, addressTopic],
    fromBlock,
    toBlock,
  };

  const [transferTo, transferFrom, operatorAuthorizationChanged, operatorRevoked] = await Promise.all([
    eventsDB.getLogs(logsProvider, transferToFilter, chainId, 'LSP7 Transfer (to)'),
    eventsDB.getLogs(logsProvider, transferFromFilter, chainId, 'LSP7 Transfer (from)'),
    eventsDB.getLogs(logsProvider, operatorAuthorizationChangedFilter, chainId, 'LSP7 OperatorAuthorizationChanged'),
    eventsDB.getLogs(logsProvider, operatorRevokedFilter, chainId, 'LSP7 OperatorRevoked'),
  ]);

  const parsedEvents = [
    ...transferTo.map((log) => parseLsp7TransferLog(log, chainId, address)),
    ...transferFrom.map((log) => parseLsp7TransferLog(log, chainId, address)),
    ...operatorAuthorizationChanged.map((log) => parseLsp7ApprovalLog(log, chainId)),
    ...operatorRevoked.map((log) => parseLsp7ApprovalLog(log, chainId)),
  ];

  // We sort the events in reverse chronological order to ensure that the most recent events are processed first
  return sortTokenEventsChronologically(parsedEvents.filter((event) => !isNullish(event))).reverse();
};

const getLsp8Events = async (
  chainId: number,
  address: Address,
  fromBlock: number,
  toBlock: number,
  logsProvider: LogsProvider,
) => {
  const getLsp8EventSelector = (eventName: 'Transfer' | 'OperatorAuthorizationChanged' | 'OperatorRevoked') => {
    return toEventSelector(getAbiItem({ abi: LSP8_ABI, name: eventName }));
  };

  const addressTopic = addressToTopic(address);

  const transferToFilter = { topics: [getLsp8EventSelector('Transfer'), null, null, addressTopic], fromBlock, toBlock };
  const transferFromFilter = { topics: [getLsp8EventSelector('Transfer'), null, addressTopic], fromBlock, toBlock };
  const operatorAuthorizationChangedFilter = {
    topics: [getLsp8EventSelector('OperatorAuthorizationChanged'), null, addressTopic],
    fromBlock,
    toBlock,
  };
  const operatorRevokedFilter = {
    topics: [getLsp8EventSelector('OperatorRevoked'), null, addressTopic],
    fromBlock,
    toBlock,
  };

  const [transferTo, transferFrom, operatorAuthorizationChanged, operatorRevoked] = await Promise.all([
    eventsDB.getLogs(logsProvider, transferToFilter, chainId, 'LSP8 Transfer (to)'),
    eventsDB.getLogs(logsProvider, transferFromFilter, chainId, 'LSP8 Transfer (from)'),
    eventsDB.getLogs(logsProvider, operatorAuthorizationChangedFilter, chainId, 'LSP8 OperatorAuthorizationChanged'),
    eventsDB.getLogs(logsProvider, operatorRevokedFilter, chainId, 'LSP8 OperatorRevoked'),
  ]);

  const parsedEvents = [
    ...transferTo.map((log) => parseLsp8TransferLog(log, chainId, address)),
    ...transferFrom.map((log) => parseLsp8TransferLog(log, chainId, address)),
    ...operatorAuthorizationChanged.map((log) => parseLsp8ApprovalLog(log, chainId)),
    ...operatorRevoked.map((log) => parseLsp8ApprovalLog(log, chainId)),
  ];

  // We sort the events in reverse chronological order to ensure that the most recent events are processed first
  return sortTokenEventsChronologically(parsedEvents.filter((event) => !isNullish(event))).reverse();
};

const parseLsp7TransferLog = (log: Log, chainId: number, owner: Address): Lsp7TransferEvent | undefined => {
  try {
    const parsedEvent = decodeEventLog({ abi: LSP7_ABI, data: log.data, topics: log.topics, strict: false }) as any;

    const { operator: spender, from, to, amount } = parsedEvent.args;
    const time = { transactionHash: log.transactionHash, blockNumber: log.blockNumber, timestamp: log.timestamp };

    if ([spender, from, to, amount].some((arg) => isNullish(arg))) return undefined;

    const payload = { spender, from, to, amount };
    return { type: TokenEventType.TRANSFER_LSP7, rawLog: log, token: log.address, chainId, owner, time, payload };
  } catch {
    console.error('Malformed LSP7 log:', log);
    return undefined;
  }
};

const parseLsp7ApprovalLog = (log: Log, chainId: number): Lsp7ApprovalEvent | undefined => {
  try {
    const parsedEvent = decodeEventLog({ abi: LSP7_ABI, data: log.data, topics: log.topics, strict: false }) as any;

    const { operator: spender, tokenOwner: owner, amount = 0n } = parsedEvent.args;
    const time = { transactionHash: log.transactionHash, blockNumber: log.blockNumber, timestamp: log.timestamp };

    if ([spender, owner, amount].some((arg) => isNullish(arg))) return undefined;

    const payload = { spender, amount };
    return { type: TokenEventType.APPROVAL_LSP7, rawLog: log, token: log.address, chainId, owner, time, payload };
  } catch {
    console.error('Malformed LSP7 log:', log);
    return undefined;
  }
};

const parseLsp8TransferLog = (log: Log, chainId: number, owner: Address): Lsp8TransferEvent | undefined => {
  try {
    const parsedEvent = decodeEventLog({ abi: LSP8_ABI, data: log.data, topics: log.topics, strict: false }) as any;

    const { operator: spender, from, to, tokenId: tokenIdBytes32 } = parsedEvent.args;
    const time = { transactionHash: log.transactionHash, blockNumber: log.blockNumber, timestamp: log.timestamp };

    if ([spender, from, to, tokenIdBytes32].some((arg) => isNullish(arg))) return undefined;

    const tokenId = fromHex(tokenIdBytes32, 'bigint');
    const payload = { spender, from, to, tokenId };
    return { type: TokenEventType.TRANSFER_LSP8, rawLog: log, token: log.address, chainId, owner, time, payload };
  } catch {
    console.error('Malformed LSP8 log:', log);
    return undefined;
  }
};

const parseLsp8ApprovalLog = (log: Log, chainId: number): Lsp8ApprovalEvent | undefined => {
  try {
    const parsedEvent = decodeEventLog({ abi: LSP8_ABI, data: log.data, topics: log.topics, strict: false }) as any;

    const { operator: spender, tokenOwner: owner, tokenId: tokenIdBytes32, notified } = parsedEvent.args;
    const time = { transactionHash: log.transactionHash, blockNumber: log.blockNumber, timestamp: log.timestamp };

    if ([spender, owner, tokenIdBytes32].some((arg) => isNullish(arg))) return undefined;

    const tokenId = fromHex(tokenIdBytes32, 'bigint');
    const payload = { spender, tokenId, approved: parsedEvent.eventName === 'OperatorAuthorizationChanged' };
    console.log('payload', payload, notified);
    return { type: TokenEventType.APPROVAL_LSP8, rawLog: log, token: log.address, chainId, owner, time, payload };
  } catch {
    console.error('Malformed LSP8 log:', log);
    return undefined;
  }
};

export const getLsp7TokenData = async (
  contract: Lsp7TokenContract,
  owner: Address,
  events: TokenEvent[],
  chainId: number,
): Promise<TokenData> => {
  const [metadata, balance] = await Promise.all([
    getLsp7TokenMetadata(contract, chainId),
    contract.publicClient.readContract({ ...contract, functionName: 'balanceOf', args: [owner] }),
    throwIfSpam(contract, events),
  ]);

  return { contract, metadata, chainId, owner, balance };
};

export const getLsp7TokenMetadata = async (contract: Lsp7TokenContract, chainId: number) => {
  const metadataFromMapping = await getTokenDataFromMapping(contract, chainId);
  if (metadataFromMapping?.isSpam) throw new Error('Token is marked as spam');

  const [totalSupply, symbol, decimals] = await Promise.all([
    contract.publicClient.readContract({ ...contract, functionName: 'totalSupply' }),
    metadataFromMapping?.symbol ??
      withFallback(
        contract.publicClient
          .readContract({
            ...contract,
            functionName: 'getData',
            args: [keccak256(toHex('LSP4TokenSymbol'))],
          })
          .then((data) => fromHex(data, 'string')),
        contract.address,
      ),
    metadataFromMapping?.decimals ?? contract.publicClient.readContract({ ...contract, functionName: 'decimals' }),
    // throwIfNotLsp7(contract),
  ]);

  return { ...metadataFromMapping, totalSupply, symbol, decimals };
};

export const getLsp8TokenData = async (
  contract: Lsp8TokenContract,
  owner: Address,
  events: TokenEvent[],
  chainId: number,
): Promise<TokenData> => {
  const transfers = events.filter((event) => event.type === TokenEventType.TRANSFER_ERC721);

  // Since the events are sorted by reverse chronological order, we know that the first event is the latest,
  // if the latest event for a tokenId is a transfer to the owner, then the owner still holds the token
  const uniqueTokenIdTransfers = deduplicateArray(transfers, (a, b) => a.payload.tokenId === b.payload.tokenId);
  const calculatedBalance = BigInt(uniqueTokenIdTransfers.filter((event) => event.payload.to === owner).length);
  const shouldFetchBalance = transfers.length === 0;

  const [metadata, balance] = await Promise.all([
    getLsp8TokenMetadata(contract, chainId),
    shouldFetchBalance
      ? contract.publicClient.readContract({ ...contract, functionName: 'balanceOf', args: [owner] })
      : calculatedBalance,
    throwIfSpam(contract, events),
  ]);

  return { contract, metadata, chainId, owner, balance };
};

export const getLsp8TokenMetadata = async (contract: Lsp8TokenContract, chainId: number) => {
  const metadataFromMapping = await getTokenDataFromMapping(contract, chainId);
  if (metadataFromMapping?.isSpam) throw new Error('Token is marked as spam');

  const [symbol] = await Promise.all([
    metadataFromMapping?.symbol ??
      withFallback(
        contract.publicClient
          .readContract({
            ...contract,
            functionName: 'getData',
            args: [keccak256(toHex('LSP4TokenName'))],
          })
          .then((data) => fromHex(data, 'string')),
        contract.address,
      ),
    // throwIfNotLsp7(contract),
  ]);

  return { ...metadataFromMapping, symbol, decimals: 0 };
};

export const getLsp7AllowancesFromApprovals = async (
  contract: Lsp7TokenContract,
  events: TokenEvent[],
  owner: Address,
): Promise<Lsp7Allowance[]> => {
  const approvalEvents = events.filter((event) => event.type === TokenEventType.APPROVAL_LSP7);
  const deduplicatedApprovalEvents = deduplicateArray(
    approvalEvents,
    (a, b) => a.token === b.token && a.owner === b.owner && a.payload.spender === b.payload.spender,
  );

  const allowances = await Promise.all(
    deduplicatedApprovalEvents.map((approval) => getLsp7AllowanceFromApproval(contract, approval, owner)),
  );

  return allowances.filter((allowance) => !isNullish(allowance));
};

const getLsp7AllowanceFromApproval = async (
  contract: Lsp7TokenContract,
  approval: Lsp7ApprovalEvent,
  owner: Address,
): Promise<Lsp7Allowance | undefined> => {
  const { spender, amount: lastApprovedAmount } = approval.payload;

  // If the most recent approval event was for 0, then we know for sure that the allowance is 0
  // If not, we need to check the current allowance because we cannot determine the allowance from the event
  // since it may have been partially used (through transferFrom)
  if (lastApprovedAmount === 0n) return undefined;

  const [amount, lastUpdated] = await Promise.all([
    contract.publicClient.readContract({
      ...contract,
      functionName: 'authorizedAmountFor',
      args: [spender, owner],
    }),
    blocksDB.getTimeLog(contract.publicClient, approval.time),
  ]);

  return { type: AllowanceType.LSP7, spender, amount, lastUpdated };
};

export const getLsp8AllowancesFromApprovals = async (
  contract: Lsp8TokenContract,
  events: TokenEvent[],
  owner: Address,
): Promise<Lsp8Allowance[]> => {
  const approvalEvents = events.filter((event) => event.type === TokenEventType.APPROVAL_LSP8);

  const deduplicatedEvents = deduplicateArray(
    approvalEvents,
    (a, b) => a.token === b.token && a.payload.tokenId === b.payload.tokenId && a.payload.spender === b.payload.spender,
  );

  const allowances = await Promise.all(
    deduplicatedEvents.map((event) => getLimitedErc721AllowanceFromApproval(contract, event)),
  );

  return allowances.filter((allowance) => !isNullish(allowance));
};

const getLimitedErc721AllowanceFromApproval = async (
  contract: Lsp8TokenContract,
  event: Lsp8ApprovalEvent,
): Promise<Lsp8Allowance | undefined> => {
  const { tokenId, spender, approved } = event.payload;

  // IF the most recent approval event was a revoke, then the approval is revoked
  if (!approved) return undefined;

  const [lastUpdated] = await Promise.all([blocksDB.getTimeLog(contract.publicClient, event.time)]);

  return { type: AllowanceType.LSP8, spender, tokenId, lastUpdated };
};

export const revokeLsp7Allowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData<Lsp7Allowance>,
  onUpdate: OnUpdate,
) => {
  return updateLsp7Allowance(walletClient, allowance, '0', onUpdate);
};

export const prepareRevokeLsp7Allowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData<Lsp7Allowance>,
): Promise<WriteContractParameters> => {
  return prepareUpdateLsp7Allowance(walletClient, allowance, 0n);
};

export const prepareUpdateLsp7Allowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData<Lsp7Allowance>,
  newAmount: bigint,
): Promise<WriteContractParameters> => {
  const differenceAmount = newAmount - allowance.payload.amount;
  if (differenceAmount === 0n) throw new Error('User rejected update transaction');

  const baseRequest = {
    ...allowance.contract,
    account: allowance.owner,
    chain: walletClient.chain,
    value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
  };

  // Some tokens can only change approval with {increase|decrease}Approval
  if (differenceAmount > 0n) {
    console.debug(`Calling contract.increaseAllowance(${allowance.payload.spender}, ${differenceAmount})`);

    const transactionRequest = {
      ...baseRequest,
      functionName: 'increaseAllowance' as const,
      args: [allowance.payload.spender, differenceAmount, '0x'] as const,
    };

    const gas = await allowance.contract.publicClient.estimateContractGas(transactionRequest);
    return { ...transactionRequest, gas };
  }

  try {
    console.debug(
      `Calling contract.decreaseAllowance(${allowance.payload.spender}, ${allowance.owner}, ${-differenceAmount})`,
    );

    const transactionRequest = {
      ...baseRequest,
      functionName: 'decreaseAllowance' as const,
      args: [allowance.payload.spender, allowance.owner, -differenceAmount, '0x'] as const,
    };

    const gas = await allowance.contract.publicClient.estimateContractGas(transactionRequest);
    return { ...transactionRequest, gas };
  } catch (error) {
    // Some time after the network was already launched and numerous tokens were deployed,
    // the LSP7 contract was updated such that 'tokenOwner' is a parameter to decreaseAllowance
    // If that fails, we try the old way without 'tokenOwner'
    console.debug(`Calling contract.decreaseAllowance(${allowance.payload.spender}, ${-differenceAmount})`);

    const transactionRequest = {
      ...baseRequest,
      functionName: 'decreaseAllowance' as const,
      args: [allowance.payload.spender, -differenceAmount, '0x'] as const,
    };

    const gas = await allowance.contract.publicClient.estimateContractGas(transactionRequest);
    return { ...transactionRequest, gas };
  }
};

// TODO: This has a lot of duplicate code with updateErc20Allowance
export const updateLsp7Allowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData<Lsp7Allowance>,
  newAmount: string,
  onUpdate: OnUpdate,
) => {
  const newAmountParsed = parseFixedPointBigInt(newAmount, allowance.metadata.decimals);
  const transactionRequest = await prepareUpdateLsp7Allowance(walletClient, allowance, newAmountParsed);
  const hash = await writeContractUnlessExcessiveGas(allowance.contract.publicClient, walletClient, transactionRequest);

  const waitForConfirmation = async () => {
    const transactionReceipt = await waitForTransactionConfirmation(hash, allowance.contract.publicClient);
    if (!transactionReceipt) return;

    const lastUpdated = await blocksDB.getTimeLog(allowance.contract.publicClient, {
      ...transactionReceipt,
      blockNumber: Number(transactionReceipt.blockNumber),
    });

    onUpdate(allowance, { amount: newAmountParsed, lastUpdated });

    return transactionReceipt;
  };

  return { hash, confirmation: waitForConfirmation() };
};

export const prepareRevokeLsp8Allowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData<Lsp8Allowance>,
): Promise<WriteContractParameters> => {
  const transactionRequest = {
    ...(allowance.contract as Lsp8TokenContract),
    functionName: 'revokeOperator' as const,
    args: [allowance.payload.spender, toHex(allowance.payload.tokenId, { size: 32 }), true, '0x'] as const,
    account: allowance.owner,
    chain: walletClient.chain,
    value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
  };

  const gas = await allowance.contract.publicClient.estimateContractGas(transactionRequest);
  return { ...transactionRequest, gas };
};

// TODO: This has a lot of duplicate code with revokeErc721Allowance
export const revokeLsp8Allowance = async (
  walletClient: WalletClient,
  allowance: TokenAllowanceData<Lsp8Allowance>,
  onUpdate: OnUpdate,
) => {
  const transactionRequest = await prepareRevokeLsp8Allowance(walletClient, allowance);
  const hash = await writeContractUnlessExcessiveGas(allowance.contract.publicClient, walletClient, transactionRequest);

  const waitForConfirmation = async () => {
    const transactionReceipt = await waitForTransactionConfirmation(hash, allowance.contract.publicClient);
    onUpdate(allowance, undefined);
    return transactionReceipt;
  };

  return { hash, confirmation: waitForConfirmation() };
};
