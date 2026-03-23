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
import { useCallback, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { toast } from 'react-toastify';
import type { Address } from 'viem';
import { useWalletClient } from 'wagmi';

export const useFairsideCoverage = (account: Address) => {
  const { data: walletClient } = useWalletClient();

  const { data: membershipInfo, isLoading: isMembershipLoading } = useQuery({
    queryKey: ['fairsideMembershipInfo', account],
    queryFn: () => getMembershipInfo({ walletAddress: account }),
  });

  const [token, setToken] = useState<string | null>(() => getStoredToken(account));

  const clearToken = useCallback(() => {
    clearStoredToken(account);
    setToken(null);
  }, [account]);

  const { data: wallets, isLoading: isWalletsLoading } = useQuery({
    queryKey: ['fairsideCoveredWallets', account, token],
    queryFn: async () => {
      try {
        const coveredWallets = await getCoveredWallets({ accessToken: token! });
        return coveredWallets?.map((w) => w.walletAddress as Address) ?? [account];
      } catch {
        // Token is likely expired, clear it
        clearToken();
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

      storeToken(account, accessToken);
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

const FAIRSIDE_TOKEN_KEY = 'fairside_token';

const getStoredToken = (account: string): string | null => {
  try {
    return localStorage.getItem(`${FAIRSIDE_TOKEN_KEY}_${account}`);
  } catch {
    return null;
  }
};

const storeToken = (account: string, token: string) => {
  try {
    localStorage.setItem(`${FAIRSIDE_TOKEN_KEY}_${account}`, token);
  } catch {}
};

const clearStoredToken = (account: string) => {
  try {
    localStorage.removeItem(`${FAIRSIDE_TOKEN_KEY}_${account}`);
  } catch {}
};
