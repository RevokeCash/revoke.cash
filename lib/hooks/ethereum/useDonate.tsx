'use client';

import { DonateButtonType } from 'components/common/donate/DonateModal';
import { DONATION_ADDRESS } from 'lib/constants';
import { TransactionType } from 'lib/interfaces';
import { getWalletAddress } from 'lib/utils';
import { track } from 'lib/utils/analytics';
import { getChainName, getChainNativeToken, getDefaultDonationAmount } from 'lib/utils/chains';
import { parseEther } from 'viem';
import { useWalletClient } from 'wagmi';
import { useHandleTransaction } from './useHandleTransaction';

export const useDonate = (chainId: number, type: DonateButtonType) => {
  const nativeToken = getChainNativeToken(chainId);
  const defaultAmount = getDefaultDonationAmount(nativeToken);
  const { data: walletClient } = useWalletClient({ chainId });
  const handleTransaction = useHandleTransaction(chainId);

  const donate = async (amount: string) => {
    if (!walletClient) {
      throw new Error('Please connect your web3 wallet to a supported network');
    }

    if (!amount || Number(amount) === 0) return;

    const transactionPromise = walletClient.sendTransaction({
      account: await getWalletAddress(walletClient),
      to: DONATION_ADDRESS,
      value: parseEther(amount),
      chain: walletClient.chain,
      kzg: undefined, // TODO: Idk why I need to add this, but since Viem v2 it's required 😅
    });

    const transactionHash = await handleTransaction(transactionPromise, TransactionType.DONATE);

    if (transactionHash) {
      track('Donated', {
        chainId,
        chainName: getChainName(chainId),
        nativeToken,
        amount: Number(amount),
        type,
      });
    }

    return transactionHash;
  };

  return { donate, nativeToken, defaultAmount };
};
