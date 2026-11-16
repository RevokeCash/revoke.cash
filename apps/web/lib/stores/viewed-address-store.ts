import type { PremiumPlanTier } from '@revoke.cash/core/premium/plans';
import { type Address, isAddressEqual } from 'viem';
import { create } from 'zustand';

// The last address pages the user viewed, so the Crisp chat can tell us which addresses a question is about
export const MAX_RECENT_ADDRESSES = 5;

export interface ViewedAddress {
  address: Address;
  domainName?: string;
  premiumTier: PremiumPlanTier | null;
}

interface ViewedAddressStore {
  viewedAddress: ViewedAddress | null;
  recentAddresses: Address[];
  setViewedAddress: (viewedAddress: ViewedAddress) => void;
}

export const useViewedAddressStore = create<ViewedAddressStore>((set) => ({
  viewedAddress: null,
  recentAddresses: [],
  setViewedAddress: (viewedAddress) => {
    set((state) => ({
      viewedAddress,
      recentAddresses: [
        viewedAddress.address,
        ...state.recentAddresses.filter((address) => !isAddressEqual(address, viewedAddress.address)),
      ].slice(0, MAX_RECENT_ADDRESSES),
    }));
  },
}));
