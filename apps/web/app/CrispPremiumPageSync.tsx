'use client';

import { Crisp } from 'crisp-sdk-web';
import { CRISP_WEBSITE_ID } from 'lib/constants';
import { useAuthSession } from 'lib/hooks/auth/useAuthSession';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { isNullish } from 'lib/utils';
import { useCallback, useEffect } from 'react';
import { useConnection } from 'wagmi';

/**
 * Syncs "potential-premium" segment to Crisp when viewing a premium address page,
 * but only if the connected user is not already a confirmed premium subscriber.
 * Must be rendered inside AddressIdentityContextProvider.
 */
const CrispPremiumPageSync = () => {
  const { isPremium } = useAddress();
  const { address: account } = useConnection();
  const { siweAddress } = useAuthSession();

  const isAuthenticated = Boolean(account && siweAddress && siweAddress === account);
  const isConfirmedPremium = isPremium && isAuthenticated;

  const syncPotentialPremium = useCallback(() => {
    if (!isPremium || isConfirmedPremium) return;

    Crisp.session.setSegments(['potential-premium'], true);
    Crisp.session.setData({ premium_status: 'potential' });
  }, [isPremium, isConfirmedPremium]);

  useEffect(() => {
    if (isNullish(CRISP_WEBSITE_ID)) return;

    syncPotentialPremium();
    Crisp.chat.onChatOpened(syncPotentialPremium);

    return () => {
      Crisp.chat.offChatOpened();
    };
  }, [syncPotentialPremium]);

  return null;
};

export default CrispPremiumPageSync;
