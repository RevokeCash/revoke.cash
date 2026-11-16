'use client';

import { CRISP_WEBSITE_ID, SITE_URL } from '@revoke.cash/core/constants';
import { isNullish } from '@revoke.cash/core/utils';
import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import { Crisp } from 'crisp-sdk-web';
import { useAuthSession } from 'lib/hooks/auth/useAuthSession';
import { useNameLookup } from 'lib/hooks/ethereum/useNameLookup';
import { usePremiumEntitlements } from 'lib/hooks/premium/usePremiumEntitlements';
import { MAX_RECENT_ADDRESSES, useViewedAddressStore } from 'lib/stores/viewed-address-store';
import { formatCrispChain, isCrispChatOpened, sendPendingCrispEvents } from 'lib/utils/crisp';
import { getConnectorName } from 'lib/utils/wallet';
import { useCallback, useEffect } from 'react';
import { type Address, isAddressEqual } from 'viem';
import { useConnection } from 'wagmi';

/**
 * Sends the user's wallet, premium status and viewed addresses to Crisp, but only once the user opens the chat.
 * The keys describe the last connected wallet and the last viewed address page, so a page without a wallet or
 * without an address does not clear what Crisp already has.
 */
const CrispChat = () => {
  const { address: account, connector, chainId } = useConnection();
  const { siweAddress, isImpersonating } = useAuthSession();
  const { domainName } = useNameLookup(account);
  const premium = usePremiumEntitlements(account);
  const { viewedAddress, recentAddresses } = useViewedAddressStore();

  const isAuthenticated = Boolean(account && siweAddress && siweAddress === account);

  const syncChatData = useCallback(() => {
    // While the admin impersonates a user, the chat on this device is still the admin's own
    if (isImpersonating) return;

    sendPendingCrispEvents();

    if (account) {
      Crisp.session.setData({
        wallet_address: account,
        wallet_verified: isAuthenticated,
        wallet_ens: domainName ?? '',
        wallet_app: connector ? getConnectorName(connector) : '',
        wallet_chain: formatCrispChain(chainId) ?? '',
        admin_wallet: getAdminLookupUrl(account),
      });

      if (!Crisp.user.getNickname()) {
        Crisp.user.setNickname(domainName ?? shortenAddress(account));
      }
    }

    if (account && !premium.isLoading) {
      Crisp.session.setData({
        premium_tier: premium.isUltimate ? 'ultimate' : premium.isPremium ? 'premium' : 'none',
        premium_source: premium.ownTier ? 'own' : premium.grantedTier ? 'granted' : '',
        premium_ends: premium.ownEndsAt ?? '',
      });
    }

    if (viewedAddress) {
      const isOwnAddress = Boolean(account && isAddressEqual(viewedAddress.address, account));

      Crisp.session.setData({
        viewed_address: viewedAddress.address,
        viewed_ens: viewedAddress.domainName ?? '',
        viewed_is_own: isOwnAddress,
        viewed_premium: viewedAddress.premiumTier ?? 'none',
        recent_addresses: mergeRecentAddresses(recentAddresses, Crisp.session.getData('recent_addresses')),
        admin_viewed: isOwnAddress ? '' : getAdminLookupUrl(viewedAddress.address),
      });
    }

    // Segments and premium_status mark a chat with a premium user, so they are only added and never downgraded
    const isConfirmedPremium = premium.isPremium && isAuthenticated;
    const isPotentialPremium =
      (premium.isPremium || Boolean(viewedAddress?.premiumTier)) &&
      Crisp.session.getData('premium_status') !== 'confirmed';

    if (isConfirmedPremium) {
      Crisp.session.setSegments(['premium'], false);
      Crisp.session.setData({ premium_status: 'confirmed' });
    } else if (isPotentialPremium) {
      Crisp.session.setSegments(['potential-premium'], false);
      Crisp.session.setData({ premium_status: 'potential' });
    }
  }, [
    account,
    connector,
    chainId,
    isAuthenticated,
    isImpersonating,
    domainName,
    premium.isLoading,
    premium.isPremium,
    premium.isUltimate,
    premium.ownTier,
    premium.grantedTier,
    premium.ownEndsAt,
    viewedAddress,
    recentAddresses,
  ]);

  useEffect(() => {
    if (isNullish(CRISP_WEBSITE_ID)) return;
    Crisp.configure(CRISP_WEBSITE_ID);
  }, []);

  useEffect(() => {
    if (isNullish(CRISP_WEBSITE_ID)) return;

    const syncIfChatOpened = () => {
      if (isCrispChatOpened()) syncChatData();
    };

    Crisp.chat.onChatOpened(syncChatData);
    // Crisp can restore an open chat after a page reload
    Crisp.session.onLoaded(syncIfChatOpened);

    // Keeps the data current when the wallet or the viewed address changes while the chat is open
    syncIfChatOpened();

    return () => {
      Crisp.chat.offChatOpened();
      Crisp.session.offLoaded();
    };
  }, [syncChatData]);

  return null;
};

// The newest addresses come first, followed by the ones that Crisp already has from earlier chats
const mergeRecentAddresses = (recentAddresses: Address[], sentAddresses: unknown): string => {
  const previousAddresses = typeof sentAddresses === 'string' ? sentAddresses.split(', ').filter(Boolean) : [];
  const uniqueAddresses = [...new Set([...recentAddresses, ...previousAddresses])];
  return uniqueAddresses.slice(0, MAX_RECENT_ADDRESSES).join(', ');
};

const getAdminLookupUrl = (address: Address) => `${SITE_URL}/admin/lookup/${address}`;

export default CrispChat;
