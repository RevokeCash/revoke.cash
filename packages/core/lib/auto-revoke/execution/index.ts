import { contracts, ExecutionMode, type ExecutionStruct } from '@metamask/smart-accounts-kit';
import { ERC20_ABI, ERC721_ABI, PERMIT2_ABI } from '@revoke.cash/core/abis';
import { AllowanceType } from '@revoke.cash/core/allowances';
import { createViemPublicClientForChain, getViemChainConfig } from '@revoke.cash/core/chains';
import { ADDRESS_ZERO } from '@revoke.cash/core/constants';
import type { AutoRevokeActionTransaction } from '@revoke.cash/core/db/types/auto-revoke-transaction';
import { getNativeTokenPriceUsd } from '@revoke.cash/core/prices';
import { isRevertedError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { DAY, MINUTE } from '@revoke.cash/core/utils/time';
import { isExcessiveGas } from '@revoke.cash/core/wallet';
import {
  type Address,
  encodeFunctionData,
  formatUnits,
  type Hex,
  type PublicClient,
  TransactionReceiptNotFoundError,
} from 'viem';
import {
  type Action,
  type ActionErrorCode,
  deferActionRetry,
  getActionById,
  getChainPipelineState,
  hasPendingExploitAction,
  markActionBroadcasted,
  markActionFailure,
  markActionReplacementSubmitted,
  markActionSubmitted,
  requeueActionAfterNonceConsumed,
  settleAction,
} from '../actions';
import { MAX_PENDING_ACTIONS_PER_CHAIN } from '../config';
import { getPermissionById, type PermissionRecord } from '../permissions';
import { checkActionCost, getNextBudgetRetryAt } from './budget';
import { getTransactionFees, type TransactionFees } from './fees';
import type { SignedTransaction, Signer, UnsignedTransaction } from './signer';
import { checkExecutionEligibility } from './validation';

export interface ExecutionResult {
  submitted: boolean;
  completed?: boolean;
  succeeded?: boolean;
  address?: Address;
  txHash?: Hex;
  reason?: string;
  detail?: string;
}

interface RevokeTransactionPlan {
  estimatedCostUsd: number | null;
  transaction: UnsignedTransaction;
}

type SubmittedTransaction = Omit<AutoRevokeActionTransaction, 'finalGasUsed'> & {
  estimatedCostUsd: number | null;
  submittedAt: Date;
};

const SUBMITTED_ATTEMPT_REPLACEMENT_DELAY_MS = 5 * MINUTE;
const URGENT_SUBMITTED_ATTEMPT_REPLACEMENT_DELAY_MS = 1 * MINUTE;

const TRANSIENT_ERROR_RETRY_DELAY_MS = 5 * MINUTE;
const PIPELINE_FULL_RETRY_DELAY_MS = 1 * MINUTE;

export const processAction = async (actionId: string, signer: Signer): Promise<ExecutionResult> => {
  const action = await getActionById(actionId);
  if (!action) return { submitted: false, reason: 'action_not_found' };

  if (action.status === 'queued' || action.status === 'blocked_budget') {
    return submitAction(action, signer);
  }

  if (action.status === 'submitted') {
    return maintainSubmittedAction(action, signer);
  }

  return { submitted: false, reason: `not_processable:${action.status}` };
};

const submitAction = async (action: Action, signer: Signer): Promise<ExecutionResult> => {
  // Advisory early exit; the authoritative depth check runs under the chain lock in markActionSubmitted.
  const pipeline = await getChainPipelineState(action.observation.chainId, signer.address);
  if (pipeline.count >= MAX_PENDING_ACTIONS_PER_CHAIN) {
    return deferForFullPipeline(action);
  }

  const eligibility = await checkExecutionEligibility(action.observation);

  if ('failure' in eligibility) {
    await markActionFailure(action.id, eligibility.failure);
    return { submitted: false, reason: eligibility.failure.errorCode };
  }

  try {
    const plan = await planRevokeTransaction(eligibility.permission, action, signer, eligibility.isUrgent);

    if (isExcessiveGas(action.observation.chainId, plan.transaction.gas)) {
      await markActionFailure(action.id, { status: 'skipped', errorCode: 'excessive_gas' });
      return { submitted: false, reason: 'excessive_gas' };
    }

    if (plan.estimatedCostUsd === null) return { submitted: false, reason: 'native_price_unavailable' };

    if (!eligibility.isUrgent) {
      const actionCostDecision = checkActionCost(plan.estimatedCostUsd);
      if (!actionCostDecision.allowed) {
        await blockForBudget(action, actionCostDecision.reason, actionCostDecision.nextRetryAt);
        return { submitted: false, reason: actionCostDecision.reason };
      }
    }

    const signedTransaction = await signer.signTransaction(plan.transaction);

    const submitResult = await markActionSubmitted(
      action.id,
      action.observation.chainId,
      signer.address,
      {
        permissionId: eligibility.permission.id,
        txHash: signedTransaction.txHash,
        rawTransaction: signedTransaction.rawTransaction,
        nonce: plan.transaction.nonce,
        maxFeePerGas: plan.transaction.maxFeePerGas,
        maxPriorityFeePerGas: plan.transaction.maxPriorityFeePerGas,
        estimatedGas: plan.transaction.gas,
        estimatedCostUsd: plan.estimatedCostUsd,
      },
      {
        address: action.observation.address,
        enforceBudget: !eligibility.isUrgent,
      },
    );

    if (submitResult === 'nonce_conflict') {
      return { submitted: false, reason: 'nonce_conflict' };
    }

    if (submitResult === 'pipeline_full') {
      return deferForFullPipeline(action);
    }

    if (submitResult === 'no_billable_subscription') {
      await blockForBudget(action, 'subscription_inactive', new Date(Date.now() + DAY));
      return { submitted: false, reason: 'subscription_inactive' };
    }

    if (submitResult === 'budget_exceeded') {
      await blockForBudget(action, 'monthly_budget');
      return { submitted: false, reason: 'monthly_budget' };
    }

    if (submitResult === 'state_changed') {
      return { submitted: false, reason: 'action_state_changed' };
    }

    const broadcastResult = await broadcastSignedTransaction(signer, signedTransaction, action.id);

    return {
      submitted: true,
      txHash: signedTransaction.txHash,
      reason: broadcastResult.reason,
      detail: broadcastResult.detail,
    };
  } catch (error) {
    const detail = parseErrorMessage(error);

    if (isRevertedError(error)) {
      await markActionFailure(action.id, { status: 'failed', errorCode: 'execution_failed' });
      return { submitted: false, reason: 'execution_failed', detail };
    }

    await deferActionRetry(action.id, {
      errorCode: 'transient_error',
      nextRetryAt: new Date(Date.now() + TRANSIENT_ERROR_RETRY_DELAY_MS),
    });
    return { submitted: false, reason: 'transient_error', detail };
  }
};

const maintainSubmittedAction = async (action: Action, signer: Signer): Promise<ExecutionResult> => {
  const transaction = getSubmittedTransaction(action);
  if (!transaction) return { submitted: false, reason: 'submitted_action_missing_transaction' };

  const confirmation = await confirmSubmittedAction(action, transaction);
  if (confirmation.completed || confirmation.reason !== 'receipt_not_found') return confirmation;

  const isUrgent = await isUrgentAction(action, signer);
  const nonceConsumed = await wasNonceConsumed(action, transaction, signer, isUrgent);

  if (nonceConsumed) {
    const requeued = await requeueActionAfterNonceConsumed(action.id);
    return { submitted: false, reason: requeued ? 'nonce_consumed_requeued' : 'action_state_changed' };
  }

  // Only the pipeline head (the lowest in-flight nonce on this chain) can be mined next
  const pipeline = await getChainPipelineState(action.observation.chainId, signer.address);
  const isPipelineHead = pipeline.minNonce === null || transaction.nonce <= pipeline.minNonce;

  if (!isPipelineHead || !isTransactionReadyForReplacement(transaction, isUrgent)) {
    return rebroadcastAction(action, transaction, signer);
  }

  return replaceAction(action, transaction, signer, isUrgent);
};

// The whole pipeline inherits exploit urgency: nonce ordering means an exploit action can only
// move once everything ahead of it clears, so a stale head in front of one escalates just as fast.
const isUrgentAction = async (action: Action, signer: Signer): Promise<boolean> => {
  if (action.observation.triggerType === 'exploit') return true;
  return await hasPendingExploitAction(action.observation.chainId, signer.address);
};

const wasNonceConsumed = async (
  action: Action,
  transaction: SubmittedTransaction,
  signer: Signer,
  isUrgent: boolean,
): Promise<boolean> => {
  if (!isTransactionReadyForReplacement(transaction, isUrgent)) return false;

  const publicClient = createViemPublicClientForChain(action.observation.chainId);
  const minedNonceCount = await publicClient.getTransactionCount({ address: signer.address, blockTag: 'latest' });
  return minedNonceCount > transaction.nonce;
};

const deferForFullPipeline = async (action: Action): Promise<ExecutionResult> => {
  await deferActionRetry(action.id, {
    errorCode: 'chain_pipeline_full',
    nextRetryAt: new Date(Date.now() + PIPELINE_FULL_RETRY_DELAY_MS),
  });
  return { submitted: false, reason: 'chain_pipeline_full' };
};

const getSubmittedTransaction = (action: Action): SubmittedTransaction | null => {
  if (!action.transaction || !action.submittedAt) return null;

  return {
    ...action.transaction,
    estimatedCostUsd: action.costUsd,
    submittedAt: action.submittedAt,
  };
};

const confirmSubmittedAction = async (action: Action, transaction: SubmittedTransaction): Promise<ExecutionResult> => {
  const publicClient = createViemPublicClientForChain(action.observation.chainId);
  for (const txHash of transaction.txHashes) {
    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
      const finalCostUsd = await getFinalCostUsd(action, transaction, receipt.gasUsed, receipt.effectiveGasPrice);
      const succeeded = receipt.status === 'success';

      const settled = await settleAction({
        actionId: action.id,
        actionStatus: succeeded ? 'succeeded' : 'failed',
        txHash,
        finalGasUsed: receipt.gasUsed,
        finalCostUsd,
        errorCode: succeeded ? undefined : 'transaction_reverted',
      });
      if (!settled) return { submitted: false, reason: 'already_settled' };

      return {
        submitted: false,
        completed: true,
        succeeded,
        address: action.observation.address,
        txHash,
        reason: succeeded ? undefined : 'transaction_reverted',
      };
    } catch (error) {
      if (error instanceof TransactionReceiptNotFoundError) continue;

      return { submitted: false, reason: 'confirmation_error', detail: parseErrorMessage(error) };
    }
  }

  return { submitted: false, reason: 'receipt_not_found' };
};

const rebroadcastAction = async (
  action: Action,
  transaction: SubmittedTransaction,
  signer: Signer,
): Promise<ExecutionResult> => {
  const signedTransaction = {
    chainId: action.observation.chainId,
    txHash: transaction.txHash,
    rawTransaction: transaction.rawTransaction,
  };

  const result = await broadcastSignedTransaction(signer, signedTransaction, action.id);
  return {
    submitted: result.submitted,
    txHash: transaction.txHash,
    reason: result.reason ?? 'receipt_not_found',
    detail: result.detail,
  };
};

const replaceAction = async (
  action: Action,
  transaction: SubmittedTransaction,
  signer: Signer,
  isUrgent: boolean,
): Promise<ExecutionResult> => {
  try {
    const replacement = await planSameNonceReplacement(action, transaction, signer, isUrgent);
    const signedTransaction = await signer.signTransaction(replacement.transaction);
    const submitted = await markActionReplacementSubmitted(action.id, {
      txHash: signedTransaction.txHash,
      rawTransaction: signedTransaction.rawTransaction,
      nonce: replacement.transaction.nonce,
      maxFeePerGas: replacement.transaction.maxFeePerGas,
      maxPriorityFeePerGas: replacement.transaction.maxPriorityFeePerGas,
      estimatedGas: replacement.transaction.gas,
      estimatedCostUsd: replacement.estimatedCostUsd,
    });
    if (!submitted) return { submitted: false, reason: 'action_state_changed' };

    const broadcastResult = await broadcastSignedTransaction(signer, signedTransaction, action.id);

    return {
      submitted: true,
      txHash: signedTransaction.txHash,
      reason: broadcastResult.reason,
      detail: broadcastResult.detail,
    };
  } catch (error) {
    await rebroadcastAction(action, transaction, signer);
    return { submitted: false, reason: 'replacement_failed', detail: parseErrorMessage(error) };
  }
};

const planSameNonceReplacement = async (
  action: Action,
  transaction: SubmittedTransaction,
  signer: Signer,
  isUrgent: boolean,
): Promise<RevokeTransactionPlan> => {
  const permission = await getStoredPermission(action);
  const calldata = buildDelegatedRevokeCalldata(permission, action, signer);

  const [transactionFees, nativeTokenPriceUsd] = await Promise.all([
    getTransactionFees({
      chainId: action.observation.chainId,
      isUrgent,
      replacementCount: transaction.txHashes.length,
      previousFees: transaction,
    }),
    getNativeTokenPriceUsd(action.observation.chainId),
  ]);

  return buildRevokeTransactionPlan(permission, action, calldata, {
    gas: transaction.estimatedGas,
    transactionFees,
    nonce: transaction.nonce,
    nativeTokenPriceUsd,
    // A stuck transaction must stay bumpable without a price feed, so carry the previous estimate.
    fallbackCostUsd: transaction.estimatedCostUsd,
  });
};

const getStoredPermission = async (action: Action): Promise<PermissionRecord> => {
  if (!action.permissionId) throw new Error('Submitted auto-revoke action is missing permissionId');

  const permission = await getPermissionById(action.permissionId);
  if (!permission) throw new Error('Submitted auto-revoke action permission was not found');

  return permission;
};

const getRevokeCall = (action: Action): ExecutionStruct => {
  const { observation } = action;
  switch (observation.allowanceType) {
    case AllowanceType.ERC20:
      return {
        value: 0n,
        target: observation.tokenAddress,
        callData: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [observation.spenderAddress, 0n],
        }),
      };
    case AllowanceType.ERC721_SINGLE:
      if (observation.tokenId === null) throw new Error('ERC721 single approval is missing tokenId');
      return {
        value: 0n,
        target: observation.tokenAddress,
        callData: encodeFunctionData({
          abi: ERC721_ABI,
          functionName: 'approve',
          args: [ADDRESS_ZERO, observation.tokenId],
        }),
      };
    case AllowanceType.ERC721_ALL:
      return {
        value: 0n,
        target: observation.tokenAddress,
        callData: encodeFunctionData({
          abi: ERC721_ABI,
          functionName: 'setApprovalForAll',
          args: [observation.spenderAddress, false],
        }),
      };
    case AllowanceType.PERMIT2:
      if (observation.permit2Address === null) throw new Error('Permit2 approval is missing Permit2 address');
      if (observation.expiration === null) throw new Error('Permit2 approval is missing expiration');
      return {
        value: 0n,
        target: observation.permit2Address,
        callData: encodeFunctionData({
          abi: PERMIT2_ABI,
          functionName: 'approve',
          args: [observation.tokenAddress, observation.spenderAddress, 0n, observation.expiration],
        }),
      };
  }
};

// Builds the nested calldata, where the inner call is the revoke call and the outer call is the cold delegation redemption.
const buildDelegatedRevokeCalldata = (permission: PermissionRecord, action: Action, signer: Signer): Hex => {
  const innerCalldata = contracts.DelegationManager.encode.redeemDelegations({
    delegations: [permission.permissionContext],
    modes: [ExecutionMode.SingleDefault],
    executions: [[getRevokeCall(action)]],
  });

  return contracts.DelegationManager.encode.redeemDelegations({
    delegations: [[signer.getColdDelegation(action.observation.chainId)]],
    modes: [ExecutionMode.SingleDefault],
    executions: [[{ target: permission.delegationManager, value: 0n, callData: innerCalldata }]],
  });
};

const blockForBudget = async (
  action: Action,
  errorCode: ActionErrorCode,
  nextRetryAt = getNextBudgetRetryAt(),
): Promise<void> => {
  await markActionFailure(action.id, {
    status: 'blocked_budget',
    errorCode,
    nextRetryAt,
  });
};

const planRevokeTransaction = async (
  permission: PermissionRecord,
  action: Action,
  signer: Signer,
  isUrgent: boolean,
): Promise<RevokeTransactionPlan> => {
  const publicClient = createViemPublicClientForChain(action.observation.chainId);
  const calldata = buildDelegatedRevokeCalldata(permission, action, signer);

  const [estimatedGas, transactionFees, nativeTokenPriceUsd, nonce] = await Promise.all([
    publicClient.estimateGas({
      account: signer.address,
      to: permission.delegationManager,
      data: calldata,
    }),
    getTransactionFees({
      chainId: action.observation.chainId,
      isUrgent,
      replacementCount: 0,
    }),
    getNativeTokenPriceUsd(action.observation.chainId),
    deriveNextNonce(publicClient, action.observation.chainId, signer.address),
  ]);

  return buildRevokeTransactionPlan(permission, action, calldata, {
    gas: addGasLimitBuffer(estimatedGas),
    transactionFees,
    nonce,
    nativeTokenPriceUsd,
    fallbackCostUsd: null,
  });
};

// Assembles a plan from the inputs that differ between a fresh submission and a same-nonce replacement
interface RevokeTransactionPlanInputs {
  gas: bigint;
  transactionFees: TransactionFees;
  nonce: number;
  nativeTokenPriceUsd: number | null;
  fallbackCostUsd: number | null;
}

const buildRevokeTransactionPlan = (
  permission: PermissionRecord,
  action: Action,
  calldata: Hex,
  inputs: RevokeTransactionPlanInputs,
): RevokeTransactionPlan => {
  const decimals = getViemChainConfig(action.observation.chainId).nativeCurrency.decimals;
  const calculatedCostUsd = calculateGasCostUsd(
    inputs.gas,
    inputs.transactionFees.expectedFeePerGas,
    inputs.nativeTokenPriceUsd,
    decimals,
  );

  return {
    estimatedCostUsd: calculatedCostUsd ?? inputs.fallbackCostUsd,
    transaction: {
      chainId: action.observation.chainId,
      data: calldata,
      gas: inputs.gas,
      maxFeePerGas: inputs.transactionFees.maxFeePerGas,
      maxPriorityFeePerGas: inputs.transactionFees.maxPriorityFeePerGas,
      nonce: inputs.nonce,
      to: permission.delegationManager,
      value: 0n,
    },
  };
};

const deriveNextNonce = async (
  publicClient: PublicClient,
  chainId: number,
  signerAddress: Address,
): Promise<number> => {
  const [pendingNonceCount, minedNonceCount, pipeline] = await Promise.all([
    publicClient.getTransactionCount({ address: signerAddress, blockTag: 'pending' }),
    publicClient.getTransactionCount({ address: signerAddress, blockTag: 'latest' }),
    getChainPipelineState(chainId, signerAddress),
  ]);

  const nonce = Math.max(pendingNonceCount, (pipeline.maxAssignedNonce ?? -1) + 1);

  if (nonce > minedNonceCount + MAX_PENDING_ACTIONS_PER_CHAIN) {
    throw new Error(
      `Derived nonce ${nonce} is implausibly far ahead of the mined nonce count ${minedNonceCount} on chain ${chainId}`,
    );
  }

  return nonce;
};

const broadcastSignedTransaction = async (
  signer: Signer,
  transaction: SignedTransaction,
  actionId: string,
): Promise<Pick<ExecutionResult, 'submitted' | 'reason' | 'detail'>> => {
  try {
    await signer.submitSignedTransaction(transaction);
    await markActionBroadcasted(actionId);
    return { submitted: true };
  } catch (error) {
    return { submitted: false, reason: 'broadcast_failed', detail: parseErrorMessage(error) };
  }
};

const getFinalCostUsd = async (
  action: Action,
  transaction: SubmittedTransaction,
  gasUsed: bigint,
  effectiveGasPrice: bigint,
): Promise<number> => {
  const nativeTokenPriceUsd = await getNativeTokenPriceUsd(action.observation.chainId);
  const chain = getViemChainConfig(action.observation.chainId);
  const costUsd = calculateGasCostUsd(gasUsed, effectiveGasPrice, nativeTokenPriceUsd, chain.nativeCurrency.decimals);
  return costUsd ?? transaction.estimatedCostUsd ?? 0;
};

const isTransactionReadyForReplacement = (transaction: SubmittedTransaction, isUrgent: boolean): boolean => {
  const replacementDelayMs = isUrgent
    ? URGENT_SUBMITTED_ATTEMPT_REPLACEMENT_DELAY_MS
    : SUBMITTED_ATTEMPT_REPLACEMENT_DELAY_MS;

  const referenceTime = transaction.broadcastedAt ?? transaction.submittedAt;
  return Date.now() - referenceTime.getTime() >= replacementDelayMs;
};

const addGasLimitBuffer = (gas: bigint): bigint => {
  return (gas * 120n) / 100n;
};

export const calculateGasCostUsd = (
  gas: bigint,
  feePerGas: bigint,
  nativeTokenPriceUsd: number | null,
  nativeTokenDecimals = 18,
): number | null => {
  if (!nativeTokenPriceUsd) return null;
  const nativeCost = Number(formatUnits(gas * feePerGas, nativeTokenDecimals));
  return Math.ceil(nativeCost * nativeTokenPriceUsd * 1_000_000) / 1_000_000;
};
