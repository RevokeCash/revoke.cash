import { ChainId } from '@revoke.cash/chains';
import { createViemPublicClientForChain, isOpStackChain } from '@revoke.cash/core/chains';
import { isNullish } from '@revoke.cash/core/utils';
import { bigintMax } from '@revoke.cash/core/utils/math';
import {
  type Address,
  type Hex,
  type PublicClient,
  parseGwei,
  serializeTransaction,
  type TransactionReceipt,
} from 'viem';
import { chainConfig as opStackChainConfig } from 'viem/op-stack';

export interface TransactionFees {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  expectedFeePerGas: bigint;
  l1DataFeeWei: bigint;
}

export interface FeeQuoteParams {
  chainId: number;
  isUrgent: boolean;
  replacementCount: number;
  previousFees?: PreviousFees;
  transaction: TransactionPayload;
}

export interface TransactionPayload {
  to: Address;
  data: Hex;
}

type PreviousFees = Pick<TransactionFees, 'maxFeePerGas' | 'maxPriorityFeePerGas'>;

type GasFees = Omit<TransactionFees, 'l1DataFeeWei'>;

// Certain chains have a validator/protocol minimum tip, so we make sure to use the minimum floor
const PRIORITY_FEE_FLOORS: Record<number, bigint> = {
  [ChainId.PolygonMainnet]: parseGwei('30'),
  [ChainId.BNBSmartChainMainnet]: parseGwei('0.06'),
  [ChainId.Monad]: parseGwei('2'),
  [ChainId.Berachain]: parseGwei('0.03'),
};

// Linea's eth_maxPriorityFeePerGas returns the protocol's dynamic profitability minimum
const ORACLE_PRIORITY_FEE_CHAINS: number[] = [ChainId.Linea];

export const getTransactionFees = async (params: FeeQuoteParams): Promise<TransactionFees> => {
  const publicClient = createViemPublicClientForChain(params.chainId);

  const [gasFees, l1DataFeeWei] = await Promise.all([
    quoteGasFeesFromHistory(publicClient, params).catch(() => quoteGasFeesFromNodeOracle(publicClient)),
    estimateL1DataFeeWei(publicClient, params.chainId, params.transaction),
  ]);

  return { ...applyPreviousFeeBumps(gasFees, params.previousFees), l1DataFeeWei };
};

const quoteGasFeesFromHistory = async (publicClient: PublicClient, params: FeeQuoteParams): Promise<GasFees> => {
  const rewardPercentiles = [getPriorityFeePercentile(params)];
  const feeHistory = await publicClient.getFeeHistory({ blockCount: 20, rewardPercentiles });

  const latestBaseFee = feeHistory.baseFeePerGas.at(-1);
  if (isNullish(latestBaseFee)) throw new Error('Fee history did not include base fees');

  const priorityFee = await resolvePriorityFee(publicClient, params, feeHistory.reward);

  return {
    maxPriorityFeePerGas: priorityFee,
    // Allow for a 2x increase in the base fee in case of a spike.
    maxFeePerGas: 2n * latestBaseFee + priorityFee,
    expectedFeePerGas: latestBaseFee + priorityFee,
  };
};

// Urgent revokes (racing an exploit) start at the 75th percentile. Normal revokes start at the 25th.
// Each replacement increases the percentile by 25, up to a maximum of 90.
const getPriorityFeePercentile = (params: Pick<FeeQuoteParams, 'isUrgent' | 'replacementCount'>): number => {
  const startPercentile = params.isUrgent ? 75 : 25;
  const bumpedPercentile = startPercentile + params.replacementCount * 25;
  const maxPercentile = 90;
  return Math.min(maxPercentile, bumpedPercentile);
};

const resolvePriorityFee = async (
  publicClient: PublicClient,
  params: FeeQuoteParams,
  reward: bigint[][] | undefined,
): Promise<bigint> => {
  if (ORACLE_PRIORITY_FEE_CHAINS.includes(params.chainId)) {
    return publicClient.estimateMaxPriorityFeePerGas();
  }

  // If a floor fee is set, we use it as the minimum priority fee to start; if it needs replacement, we use the median reward
  const floorFee = PRIORITY_FEE_FLOORS[params.chainId];
  if (!isNullish(floorFee) && params.replacementCount === 0) return floorFee;

  const paidPercentileFee = getMedianReward(reward);
  return bigintMax(paidPercentileFee, floorFee ?? 1n);
};

const getMedianReward = (reward: bigint[][] | undefined): bigint => {
  const perBlockRewards = (reward ?? []).map((blockRewards) => blockRewards[0]).filter((value) => !isNullish(value));
  if (perBlockRewards.length === 0) throw new Error('Fee history did not include priority fee rewards');

  const sortedRewards = [...perBlockRewards].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return sortedRewards[Math.floor(sortedRewards.length / 2)];
};

// Last resort when eth_feeHistory is unavailable (e.g. a failover RPC without it)
const quoteGasFeesFromNodeOracle = async (publicClient: PublicClient): Promise<GasFees> => {
  const estimatedFees = await publicClient.estimateFeesPerGas();
  if (estimatedFees.maxFeePerGas === undefined || estimatedFees.maxPriorityFeePerGas === undefined) {
    throw new Error('Auto-revoke chain did not return EIP-1559 fee data');
  }

  return {
    maxFeePerGas: estimatedFees.maxFeePerGas,
    maxPriorityFeePerGas: estimatedFees.maxPriorityFeePerGas,
    expectedFeePerGas: estimatedFees.maxFeePerGas,
  };
};

export class ReplacementFeeCeilingError extends Error {
  constructor() {
    super('Replacement fee would exceed the ceiling relative to the market fee quote');
    this.name = 'ReplacementFeeCeilingError';
  }
}

// When replacing a previous fee, we need to make sure that the new fee is strictly greater than the previous fee,
// even if the new calculated fee is lower. We do this by bumping the fee by 12.5% + 1 wei.
const applyPreviousFeeBumps = (fees: GasFees, previousFees?: PreviousFees): GasFees => {
  if (!previousFees) return fees;

  const maxPriorityFeePerGas = bigintMax(fees.maxPriorityFeePerGas, bumpFee(previousFees.maxPriorityFeePerGas));

  const priorityFeeCeiling = 10n * bigintMax(fees.maxPriorityFeePerGas, 1n);
  if (maxPriorityFeePerGas > priorityFeeCeiling) throw new ReplacementFeeCeilingError();

  const priorityFeeIncrease = maxPriorityFeePerGas - fees.maxPriorityFeePerGas;

  return {
    maxPriorityFeePerGas,
    maxFeePerGas: bigintMax(fees.maxFeePerGas + priorityFeeIncrease, bumpFee(previousFees.maxFeePerGas)),
    expectedFeePerGas: fees.expectedFeePerGas + priorityFeeIncrease,
  };
};

// +12.5% +1 wei (above the ~10% minimum replacement increment most nodes enforce).
const bumpFee = (fee: bigint): bigint => (fee * 1125n) / 1000n + 1n;

const GAS_PRICE_ORACLE_ABI = [
  {
    type: 'function',
    name: 'getL1Fee',
    stateMutability: 'view',
    inputs: [{ name: '_data', type: 'bytes' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const estimateL1DataFeeWei = async (
  publicClient: PublicClient,
  chainId: number,
  transaction: TransactionPayload,
): Promise<bigint> => {
  if (!isOpStackChain(chainId)) return 0n;

  try {
    const serializedTransaction = serializeTransaction({
      type: 'eip1559',
      chainId,
      to: transaction.to,
      value: 0n,
      data: transaction.data,
      // Placeholders:
      gas: 300_000n,
      nonce: 1,
      maxFeePerGas: parseGwei('5'),
      maxPriorityFeePerGas: parseGwei('1'),
    });

    return await publicClient.readContract({
      address: opStackChainConfig.contracts.gasPriceOracle.address,
      abi: GAS_PRICE_ORACLE_ABI,
      functionName: 'getL1Fee',
      args: [serializedTransaction],
    });
  } catch (error) {
    console.error(`Failed to estimate L1 data fee on chain ${chainId}, continuing without it:`, error);
    return 0n;
  }
};

export const getReceiptL1DataFeeWei = (receipt: TransactionReceipt): bigint => {
  const { l1Fee } = receipt as TransactionReceipt & { l1Fee?: bigint | null };
  return l1Fee ?? 0n;
};
