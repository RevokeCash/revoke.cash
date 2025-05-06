'use client';

import type { DonateButtonType } from 'components/common/donate/DonateModal';
import { DONATION_ADDRESS } from 'lib/constants';
import { type TransactionSubmitted, TransactionType } from 'lib/interfaces';
import { waitForTransactionConfirmation } from 'lib/utils';
import analytics from 'lib/utils/analytics';
import { type DocumentedChainId, getChainNativeToken, isTestnetChain } from 'lib/utils/chains';
import { type SendTransactionParameters, parseEther } from 'viem';
import { usePublicClient, useWalletClient } from 'wagmi';
import { useHandleTransaction } from './useHandleTransaction';
import { useNativeTokenPrice } from './useNativeTokenPrice';

export const useDonate = (chainId: number, type: DonateButtonType) => {
  const nativeToken = getChainNativeToken(chainId)!;
  const { data: walletClient } = useWalletClient({ chainId });
  const publicClient = usePublicClient({ chainId })!;
  const handleTransaction = useHandleTransaction(chainId);
  const { nativeTokenPrice } = useNativeTokenPrice(chainId);

  const sendDonation = async (dollarAmount: string): Promise<TransactionSubmitted> => {
    if (!walletClient) {
      throw new Error('Please connect your web3 wallet to a supported network');
    }

    const hash = await walletClient.sendTransaction(await prepareDonate(dollarAmount));

    return { hash, confirmation: waitForTransactionConfirmation(hash, publicClient) };
  };

  const prepareDonate = async (dollarAmount: string): Promise<SendTransactionParameters> => {
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

  const donate = async (dollarAmount: string): Promise<TransactionSubmitted | undefined> => {
    const transactionSubmitted = await handleTransaction(sendDonation(dollarAmount), TransactionType.DONATE);
    if (transactionSubmitted) trackDonate(chainId, dollarAmount, type);
    return transactionSubmitted;
  };

  return { prepareDonate, donate, nativeToken };
};

export const trackDonate = (chainId: DocumentedChainId, dollarAmount: string, type: DonateButtonType) => {
  if (!Number(dollarAmount)) return;
  if (isTestnetChain(chainId)) return;

  analytics.track('Donated', {
    chainId,
    dollarAmount: Number(dollarAmount),
    type,
  });
};
