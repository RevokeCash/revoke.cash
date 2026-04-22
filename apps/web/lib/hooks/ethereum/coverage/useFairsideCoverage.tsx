'use client';

import { useQuery } from '@tanstack/react-query';
import {
  FAIRSIDE_REFERRAL_CODE,
  getAuthenticationMessage,
  getCoveredWallets,
  getMembershipInfo,
  loginUser,
} from 'lib/coverage/fairside';
import { isNullish } from 'lib/utils';
import { isUserRejectionError, parseErrorMessage } from 'lib/utils/errors';
import { useAsyncCallback } from 'react-async-hook';
import { toast } from 'react-toastify';
import useLocalStorage from 'use-local-storage';
import type { Address } from 'viem';
import { useWalletClient } from 'wagmi';

const FAIRSIDE_TOKEN_KEY = 'fairside_token';

export const useFairsideCoverage = (account: Address) => {
  const { data: walletClient } = useWalletClient();

  const { data: membershipInfo, isLoading: isMembershipLoading } = useQuery({
    queryKey: ['fairsideMembershipInfo', account],
    queryFn: () => getMembershipInfo({ walletAddress: account }),
  });

  const [token, setToken] = useLocalStorage<string | null>(`${FAIRSIDE_TOKEN_KEY}_${account}`, null);

  const { data: wallets, isLoading: isWalletsLoading } = useQuery({
    queryKey: ['fairsideCoveredWallets', account, token],
    queryFn: async () => {
      try {
        const coveredWallets = await getCoveredWallets({ accessToken: token! });
        return coveredWallets?.map((w) => w.walletAddress) ?? [account];
      } catch {
        // Token is likely expired, clear it
        setToken(null);
        return null;
      }
    },
    enabled: !isNullish(token),
  });

  const { execute: authenticate, loading: isAuthenticating } = useAsyncCallback(async () => {
    if (!walletClient) {
      toast.error('Please connect your wallet to authenticate');
      return;
    }

    try {
      const messageData = await getAuthenticationMessage({ walletAddress: account });
      if (!messageData) {
        toast.error('Could not generate authentication message');
        return;
      }

      const signature = await walletClient.signMessage({ message: messageData.message });

      const accessToken = await loginUser({
        walletAddress: account,
        signature,
        nonce: messageData.nonce,
        referralCode: FAIRSIDE_REFERRAL_CODE,
      });

      if (!accessToken) {
        toast.error('Failed to authenticate');
        return;
      }

      setToken(accessToken);
    } catch (error) {
      console.error('Authentication error:', error);
      if (isUserRejectionError(parseErrorMessage(error))) return;
      toast.error('Failed to authenticate with Fairside');
    }
  });

  return {
    membershipInfo,
    isMembershipLoading,
    isActive: membershipInfo?.isActive ?? false,
    isAuthenticated: !isNullish(token),
    hasWalletClient: !isNullish(walletClient),
    wallets: wallets ?? null,
    isWalletsLoading,
    authenticate,
    isAuthenticating,
  };
};
