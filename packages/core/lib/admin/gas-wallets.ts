import { EXECUTOR_WALLETS, EXECUTOR_WALLETS_FIRST_FUNDED_AT } from '@revoke.cash/core/admin/executor';
import {
  type BlockRange,
  type ExplorerTransaction,
  fetchExplorerTransactions,
  getBlockRange,
  getExplorerWalletBalance,
} from '@revoke.cash/core/admin/explorer';
import { AUTO_REVOKE_SUPPORTED_CHAINS } from '@revoke.cash/core/auto-revoke/config';
import type { ExecutionLane } from '@revoke.cash/core/auto-revoke/execution/signer';
import { createViemPublicClientForChain, getChainNativeToken } from '@revoke.cash/core/chains';
import { getHistoricalNativeTokenPriceUsd } from '@revoke.cash/core/prices';
import { type Address, formatEther, getAddress, type Hash, isAddressEqual } from 'viem';

// Native token flows of the auto-revoke executor wallets, which pay the gas of every auto-revoke transaction.
// Native transfers emit no logs, so deposits are read from the explorer transaction lists: direct transfers show up
// in the normal list, while bridge deliveries (how most chains are funded) show up in the internal list. Balances at
// the period boundaries turn the deposits into a reconciliation: spent = opening balance + deposits - closing balance.

export interface GasWalletReport {
  deposits: GasDeposit[];
  balances: GasWalletChainBalance[];
}

export interface GasDeposit {
  chainId: number;
  lane: ExecutionLane;
  walletAddress: Address;
  senderAddress: Address;
  transactionHash: Hash;
  timestamp: Date;
  amountWei: bigint;
  nativeToken: string;
  priceUsd: number;
  valueUsdCents: number;
}

// Both executor wallets combined, because funds can move between them. Raw amounts in wei are strings, because
// JSON has no bigint.
export interface GasWalletChainBalance {
  chainId: number;
  nativeToken: string;
  openingBalanceWei: string;
  depositedWei: string;
  // Everything that left the wallets, which is gas unless funds were moved out
  spentWei: string;
  closingBalanceWei: string;
  closingValueUsd: number;
}

export interface GasDepositChainSummary {
  chainId: number;
  nativeToken: string;
  depositCount: number;
  // Raw amount in wei as a string, because JSON has no bigint
  amountWei: string;
  valueUsdCents: number;
}

export const getGasWalletReport = async (from: Date, to: Date): Promise<GasWalletReport> => {
  const periodStart = from > EXECUTOR_WALLETS_FIRST_FUNDED_AT ? from : EXECUTOR_WALLETS_FIRST_FUNDED_AT;
  // Explorers reject timestamps in the future, so a period that is still running ends now
  const periodEnd = to.getTime() < Date.now() ? to : new Date();
  if (periodStart > periodEnd) return { deposits: [], balances: [] };

  const chainReports = await Promise.all(
    AUTO_REVOKE_SUPPORTED_CHAINS.map((chainId) => getChainWalletReport(chainId, periodStart, periodEnd)),
  );

  return {
    deposits: chainReports
      .flatMap((chainReport) => chainReport.deposits)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    balances: chainReports.map((chainReport) => chainReport.balance),
  };
};

export const buildGasDepositSummary = (deposits: GasDeposit[]): GasDepositChainSummary[] => {
  return AUTO_REVOKE_SUPPORTED_CHAINS.map((chainId) => {
    const chainDeposits = deposits.filter((deposit) => deposit.chainId === chainId);

    return {
      chainId,
      nativeToken: getChainNativeToken(chainId),
      depositCount: chainDeposits.length,
      amountWei: String(sumDepositAmounts(chainDeposits)),
      valueUsdCents: chainDeposits.reduce((sum, deposit) => sum + deposit.valueUsdCents, 0),
    };
  }).filter((summary) => summary.depositCount > 0);
};

const getChainWalletReport = async (
  chainId: number,
  from: Date,
  to: Date,
): Promise<{ deposits: GasDeposit[]; balance: GasWalletChainBalance }> => {
  const blockRange = await getBlockRange(chainId, from, to);

  const [deposits, openingBalanceWei, closingBalanceWei, closingPriceUsd] = await Promise.all([
    fetchChainGasDeposits(chainId, blockRange),
    getExecutorWalletsBalance(chainId, blockRange.startBlock - 1),
    getExecutorWalletsBalance(chainId, blockRange.endBlock),
    getHistoricalNativeTokenPriceUsd(chainId, to),
  ]);

  if (closingPriceUsd === null) {
    throw new Error(`No historical native token price for chain ${chainId} at ${to.toISOString()}`);
  }

  const depositedWei = sumDepositAmounts(deposits);

  return {
    deposits,
    balance: {
      chainId,
      nativeToken: getChainNativeToken(chainId),
      openingBalanceWei: String(openingBalanceWei),
      depositedWei: String(depositedWei),
      spentWei: String(openingBalanceWei + depositedWei - closingBalanceWei),
      closingBalanceWei: String(closingBalanceWei),
      closingValueUsd: Number(formatEther(closingBalanceWei)) * closingPriceUsd,
    },
  };
};

const sumDepositAmounts = (deposits: GasDeposit[]): bigint => {
  return deposits.reduce((sum, deposit) => sum + deposit.amountWei, 0n);
};

const fetchChainGasDeposits = async (chainId: number, blockRange: BlockRange): Promise<GasDeposit[]> => {
  const depositsByWallet = await Promise.all(
    EXECUTOR_WALLETS.map(async ({ lane, address }) => {
      const [transactions, internalTransactions] = await Promise.all([
        fetchExplorerTransactions(chainId, 'txlist', address, blockRange),
        fetchExplorerTransactions(chainId, 'txlistinternal', address, blockRange),
      ]);

      const deposits = [...transactions, ...internalTransactions].filter((transaction) =>
        isDeposit(transaction, address),
      );

      return Promise.all(deposits.map((transaction) => toGasDeposit(chainId, lane, address, transaction)));
    }),
  );

  return depositsByWallet.flat();
};

// Transfers between the executor wallets only move existing funds around, so they do not count as deposits
const isDeposit = (transaction: ExplorerTransaction, walletAddress: Address): boolean => {
  return (
    transaction.isError === '0' &&
    BigInt(transaction.value) > 0n &&
    transaction.to.toLowerCase() === walletAddress.toLowerCase() &&
    !EXECUTOR_WALLETS.some((wallet) => isAddressEqual(wallet.address, transaction.from))
  );
};

const toGasDeposit = async (
  chainId: number,
  lane: ExecutionLane,
  walletAddress: Address,
  transaction: ExplorerTransaction,
): Promise<GasDeposit> => {
  const timestamp = new Date(Number(transaction.timeStamp) * 1000);
  const amountWei = BigInt(transaction.value);

  // A deposit without a price would silently understate the total, so the whole report fails instead
  const priceUsd = await getHistoricalNativeTokenPriceUsd(chainId, timestamp);
  if (priceUsd === null) {
    throw new Error(`No historical native token price for chain ${chainId} at ${timestamp.toISOString()}`);
  }

  return {
    chainId,
    lane,
    walletAddress,
    senderAddress: getAddress(transaction.from),
    transactionHash: transaction.hash,
    timestamp,
    amountWei,
    nativeToken: getChainNativeToken(chainId),
    priceUsd,
    valueUsdCents: Math.round(Number(formatEther(amountWei)) * priceUsd * 100),
  };
};

const getExecutorWalletsBalance = async (chainId: number, blockNumber: number): Promise<bigint> => {
  const balances = await Promise.all(
    EXECUTOR_WALLETS.map(({ address }) => getWalletBalance(chainId, address, blockNumber)),
  );

  return balances.reduce((sum, balance) => sum + balance, 0n);
};

// Not every RPC keeps historical state (e.g. Monad), so the explorer's balance history is the fallback
const getWalletBalance = async (chainId: number, address: Address, blockNumber: number): Promise<bigint> => {
  try {
    return await createViemPublicClientForChain(chainId).getBalance({ address, blockNumber: BigInt(blockNumber) });
  } catch {
    return getExplorerWalletBalance(chainId, address, blockNumber);
  }
};
