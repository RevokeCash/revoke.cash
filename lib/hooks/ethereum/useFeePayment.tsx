'use client';

import { DONATION_ADDRESS } from 'lib/constants';
import { type TransactionSubmitted, TransactionType } from 'lib/interfaces';
import { waitForTransactionConfirmation } from 'lib/utils';
import analytics from 'lib/utils/analytics';
import { type DocumentedChainId, getChainNativeToken, isTestnetChain } from 'lib/utils/chains';
import { parseEther, type SendTransactionParameters } from 'viem';
import { usePublicClient, useWalletClient } from 'wagmi';
import { useHandleTransaction } from './useHandleTransaction';
import { useNativeTokenPrice } from './useNativeTokenPrice';

export const useFeePayment = (chainId: number) => {
  const nativeToken = getChainNativeToken(chainId)!;
  const { data: walletClient } = useWalletClient({ chainId });
  const publicClient = usePublicClient({ chainId })!;
  const handleTransaction = useHandleTransaction(chainId);
  const { nativeTokenPrice } = useNativeTokenPrice(chainId);

  const sendFeePaymentInternal = async (dollarAmount: string): Promise<TransactionSubmitted> => {
    if (!walletClient) {
      throw new Error('Please connect your web3 wallet to a supported network');
    }

    const hash = await walletClient.sendTransaction(await prepareFeePayment(dollarAmount));

    return { hash, confirmation: waitForTransactionConfirmation(hash, publicClient) };
  };

  const prepareFeePayment = async (dollarAmount: string): Promise<SendTransactionParameters> => {
    if (!walletClient) {
      throw new Error('Please connect your web3 wallet to a supported network');
    }

    if (!nativeTokenPrice) {
      throw new Error('Could not get native token price for donation');
    }

    if (!dollarAmount || Number(dollarAmount) === 0) {
      throw new Error('User rejected donation');
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

    const transactionSubmitted = await handleTransaction(sendFeePaymentInternal(dollarAmount), TransactionType.FEE);
    if (transactionSubmitted) trackFeePaid(chainId, dollarAmount);
    return transactionSubmitted;
  };

  return { prepareFeePayment, sendFeePayment, nativeToken };
};

export const trackFeePaid = (chainId: DocumentedChainId, dollarAmountStr: string) => {
  const dollarAmount = Number(dollarAmountStr);

  if (!dollarAmount) return;
  if (isTestnetChain(chainId)) return;

  analytics.track('Fee Paid', { chainId, dollarAmount });
};
