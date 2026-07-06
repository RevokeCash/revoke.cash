import { ChainId } from '@revoke.cash/chains';
import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import { isNullish } from '@revoke.cash/core/utils';
import { bigintMax } from '@revoke.cash/core/utils/math';
import { type PublicClient, parseGwei } from 'viem';

export interface TransactionFees {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  expectedFeePerGas: bigint;
}

export interface FeeQuoteParams {
  chainId: number;
  isUrgent: boolean;
  replacementCount: number;
  previousFees?: PreviousFees;
}

type PreviousFees = Omit<TransactionFees, 'expectedFeePerGas'>;

// Certain chains have a validator/protocol minimum tip, so we make sure to use the minimum floor
const PRIORITY_FEE_FLOORS: Record<number, bigint> = {
  [ChainId.PolygonMainnet]: parseGwei('30'),
  [ChainId.BNBSmartChainMainnet]: parseGwei('0.06'),
  [ChainId.Monad]: parseGwei('2'),
  [ChainId.Berachain]: parseGwei('0.03'),
};

// Linea's eth_maxPriorityFeePerGas returns the protocol's dynamic profitability minimum
const ORACLE_PRIORITY_FEE_CHAINS: number[] = [ChainId.Linea];

// Gets the transaction fees based on fee history (falling back to the node oracle if the fee history is not available)
export const getTransactionFees = async (params: FeeQuoteParams): Promise<TransactionFees> => {
  const publicClient = createViemPublicClientForChain(params.chainId);
  const fees = await quoteFeesFromFeeHistory(publicClient, params).catch(() => quoteFeesFromNodeOracle(publicClient));
  return applyPreviousFeeBumps(fees, params.previousFees);
};

const quoteFeesFromFeeHistory = async (
  publicClient: PublicClient,
  params: FeeQuoteParams,
): Promise<TransactionFees> => {
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
const quoteFeesFromNodeOracle = async (publicClient: PublicClient): Promise<TransactionFees> => {
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

// When replacing a previous fee, we need to make sure that the new fee is strictly greater than the previous fee,
// even if the new calculated fee is lower. We do this by bumping the fee by 12.5% + 1 wei.
const applyPreviousFeeBumps = (fees: TransactionFees, previousFees?: PreviousFees): TransactionFees => {
  if (!previousFees) return fees;

  const maxPriorityFeePerGas = bigintMax(fees.maxPriorityFeePerGas, bumpFee(previousFees.maxPriorityFeePerGas));
  const priorityFeeIncrease = maxPriorityFeePerGas - fees.maxPriorityFeePerGas;

  return {
    maxPriorityFeePerGas,
    maxFeePerGas: bigintMax(fees.maxFeePerGas + priorityFeeIncrease, bumpFee(previousFees.maxFeePerGas)),
    expectedFeePerGas: fees.expectedFeePerGas + priorityFeeIncrease,
  };
};

// +12.5% +1 wei (above the ~10% minimum replacement increment most nodes enforce).
const bumpFee = (fee: bigint): bigint => (fee * 1125n) / 1000n + 1n;
