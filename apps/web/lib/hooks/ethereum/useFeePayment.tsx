'use client';

import { type DocumentedChainId, getChainNativeToken, isTestnetChain } from '@revoke.cash/core/chains';
import { FEES_ADDRESS } from '@revoke.cash/core/constants';
import type { TransactionSubmitted } from '@revoke.cash/core/types';
import { isNoFeeRequiredError } from '@revoke.cash/core/utils/errors';
import { withFallback } from '@revoke.cash/core/utils/promises';
import { HOUR } from '@revoke.cash/core/utils/time';
import { isZeroFeeDollarAmount } from 'components/allowances/controls/batch-revoke/fee';
import { recordBatchRevoke } from 'lib/allowances/batch-revoke';
import analytics from 'lib/utils/analytics';
import { waitForWalletTransactionConfirmation } from 'lib/utils/wallet';
import useLocalStorage from 'use-local-storage';
import { type Address, type Hash, parseEther, type SendTransactionParameters } from 'viem';
import { usePublicClient } from 'wagmi';
import { type ConnectedWalletClient, useEnsureWalletClient } from './ensureWalletClient';
import { useNativeTokenPrice } from './useNativeTokenPrice';

export const useFeePayment = (chainId: number) => {
  const nativeToken = getChainNativeToken(chainId)!;
  const { ensureWalletClient } = useEnsureWalletClient();
  const publicClient = usePublicClient({ chainId })!;
  const { nativeTokenPrice } = useNativeTokenPrice(chainId);

  // We keep track of the most recent fee payments per chain/address combination, to prevent potential duplicate fee payments
  const [lastFeePayments, setLastFeePayments] = useLocalStorage<Record<string, number>>('last-fee-payments', {});

  const getFeeValue = (dollarAmount: string, address: Address): bigint => {
    const feePaymentKey = `${chainId}-${address}`;
    const lastFeePayment = lastFeePayments[feePaymentKey];
    if (lastFeePayment && Date.now() - lastFeePayment < 1 * HOUR) {
      throw new Error('No fee required: Fee payment already registered in the last hour');
    }

    if (!nativeTokenPrice) {
      throw new Error('No fee required: Could not get native token price for fee payment');
    }

    if (isZeroFeeDollarAmount(dollarAmount)) {
      throw new Error('No fee required: Fee amount is zero');
    }

    const tokenAmount = Number(dollarAmount) / nativeTokenPrice;
    return parseEther(tokenAmount.toString());
  };

  const prepareFeePayment = (dollarAmount: string, walletClient: ConnectedWalletClient): SendTransactionParameters => {
    return {
      account: walletClient.account!,
      to: FEES_ADDRESS,
      value: getFeeValue(dollarAmount, walletClient.account.address),
      chain: walletClient.chain,
      kzg: undefined, // TODO: Idk why I need to add this, but since Viem v2 it's required 😅
    };
  };

  // Some batching wallets skip a fee call that the balance cannot cover and still execute the revokes
  const hasEnoughBalanceForFee = async (dollarAmount: string, address: Address) => {
    try {
      const value = getFeeValue(dollarAmount, address);
      // If the balance cannot be fetched, the wallet handles an insufficient balance instead of us blocking the batch
      const balance = await withFallback<bigint | null>(publicClient.getBalance({ address }), null);
      return balance === null || balance >= value;
    } catch (error) {
      if (isNoFeeRequiredError(error)) return true;
      throw error;
    }
  };

  const sendFeePayment = async (dollarAmount: string): Promise<TransactionSubmitted | undefined> => {
    if (!dollarAmount || Number(dollarAmount) === 0) return;

    try {
      const walletClient = await ensureWalletClient(chainId);
      const hash = await walletClient.sendTransaction(prepareFeePayment(dollarAmount, walletClient));

      trackFeePaid(chainId, walletClient.account.address, dollarAmount, hash);

      return { hash, confirmation: waitForWalletTransactionConfirmation(hash, publicClient, walletClient) };
    } catch (error) {
      if (isNoFeeRequiredError(error)) return;
      throw error;
    }
  };

  const trackFeePaid = (
    chainId: DocumentedChainId,
    address: Address,
    dollarAmountStr: string,
    transactionHash: Hash,
  ) => {
    recordBatchRevoke(chainId, transactionHash, address, dollarAmountStr); // Don't await

    const dollarAmount = Number(dollarAmountStr);
    if (!dollarAmount) return;

    const feePaymentKey = `${chainId}-${address}`;
    setLastFeePayments((prev) => ({ ...prev, [feePaymentKey]: Date.now() }));

    if (isTestnetChain(chainId)) return;

    analytics.track('Fee Paid', { address, chainId, dollarAmount, transactionHash });
  };

  return { prepareFeePayment, hasEnoughBalanceForFee, sendFeePayment, nativeToken, trackFeePaid };
};
