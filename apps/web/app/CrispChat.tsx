'use client';

import { Crisp } from 'crisp-sdk-web';
import { CRISP_WEBSITE_ID } from 'lib/constants';
import { useAuthSession } from 'lib/hooks/auth/useAuthSession';
import { usePremiumEntitlements } from 'lib/hooks/premium/usePremiumEntitlements';
import { isNullish } from 'lib/utils';
import { useCallback, useEffect } from 'react';
import { useConnection } from 'wagmi';

const CrispChat = () => {
  const { address: account } = useConnection();
  const { siweAddress } = useAuthSession();

  const isAuthenticated = Boolean(account && siweAddress && siweAddress === account);
  const { isPremium, isLoading } = usePremiumEntitlements(account);
  const isConfirmedPremium = isPremium && isAuthenticated;

  const syncPremiumStatus = useCallback(() => {
    if (isLoading) return;

    if (isConfirmedPremium) {
      Crisp.session.setSegments(['premium'], true);
      Crisp.session.setData({ premium_status: 'confirmed' });
    } else if (isPremium) {
      Crisp.session.setSegments(['potential-premium'], true);
      Crisp.session.setData({ premium_status: 'potential' });
    }
  }, [isLoading, isPremium, isConfirmedPremium]);

  useEffect(() => {
    if (isNullish(CRISP_WEBSITE_ID)) return;
    Crisp.configure(CRISP_WEBSITE_ID);
  }, []);

  useEffect(() => {
    if (isNullish(CRISP_WEBSITE_ID)) return;

    syncPremiumStatus();
    Crisp.chat.onChatOpened(syncPremiumStatus);

    return () => {
      Crisp.chat.offChatOpened();
    };
  }, [syncPremiumStatus]);

  return null;
};

export default CrispChat;
