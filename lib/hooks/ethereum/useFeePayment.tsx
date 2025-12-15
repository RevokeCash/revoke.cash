'use client';

import { isZeroFeeDollarAmount } from 'components/allowances/controls/batch-revoke/fee';
import { DONATION_ADDRESS } from 'lib/constants';
import type { TransactionSubmitted } from 'lib/interfaces';
import { waitForTransactionConfirmation } from 'lib/utils';
import analytics from 'lib/utils/analytics';
import { recordBatchRevoke } from 'lib/utils/batch-revoke';
import { type DocumentedChainId, getChainNativeToken, isTestnetChain } from 'lib/utils/chains';
import { isNoFeeRequiredError } from 'lib/utils/errors';
import { HOUR } from 'lib/utils/time';
import useLocalStorage from 'use-local-storage';
import { type Hash, parseEther, type SendTransactionParameters } from 'viem';
import { usePublicClient, useWalletClient } from 'wagmi';
import { useNativeTokenPrice } from './useNativeTokenPrice';

export const useFeePayment = (chainId: number) => {
  const nativeToken = getChainNativeToken(chainId)!;
  const { data: walletClient } = useWalletClient({ chainId });
  const publicClient = usePublicClient({ chainId })!;
  const { nativeTokenPrice } = useNativeTokenPrice(chainId);

  // We keep track of the most recent fee payments per chain/address combination, to prevent potential duplicate fee payments
  const [lastFeePayments, setLastFeePayments] = useLocalStorage<Record<string, number>>('last-fee-payments', {});

  const prepareFeePayment = (dollarAmount: string): SendTransactionParameters => {
    if (!walletClient) {
      throw new Error('Please connect your web3 wallet to a supported network');
    }

    const feePaymentKey = `${chainId}-${walletClient.account.address}`;
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

    return {
      account: walletClient.account!,
      to: DONATION_ADDRESS,
      value: parseEther(tokenAmount.toString()),
      chain: walletClient.chain,
      kzg: undefined, // TODO: Idk why I need to add this, but since Viem v2 it's required 😅
    };
  };

  const sendFeePayment = async (dollarAmount: string): Promise<TransactionSubmitted | undefined> => {
    if (!dollarAmount || Number(dollarAmount) === 0) return;

    try {
      if (!walletClient) {
        throw new Error('Please connect your web3 wallet to a supported network');
      }

      const hash = await walletClient.sendTransaction(prepareFeePayment(dollarAmount));

      trackFeePaid(chainId, walletClient.account.address, dollarAmount, hash);

      return { hash, confirmation: waitForTransactionConfirmation(hash, publicClient) };
    } catch (error) {
      if (isNoFeeRequiredError(error)) return;
      throw error;
    }
  };

  const trackFeePaid = (
    chainId: DocumentedChainId,
    address: string,
    dollarAmountStr: string,
    transactionHash: Hash,
  ) => {
    recordBatchRevoke(chainId, transactionHash, dollarAmountStr); // Don't await

    const dollarAmount = Number(dollarAmountStr);
    if (!dollarAmount) return;

    const feePaymentKey = `${chainId}-${address}`;
    setLastFeePayments((prev) => ({ ...prev, [feePaymentKey]: Date.now() }));

    if (isTestnetChain(chainId)) return;

    analytics.track('Fee Paid', { address, chainId, dollarAmount, transactionHash });
  };

  return { prepareFeePayment, sendFeePayment, nativeToken, trackFeePaid };
};
