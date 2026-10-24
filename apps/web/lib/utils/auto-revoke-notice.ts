import analytics from 'lib/utils/analytics';
import type { Address } from 'viem';

interface AutoRevokeNoticeEvent {
  action: 'view' | 'click' | 'learn_more' | 'dismiss';
  notice: 'setup_needed' | 'upgrade_needed';
  location: 'dashboard' | 'account' | 'header';
  account: Address;
  chainIds?: number[];
}

// The account is included so the funnel can be matched against the auto-revoke permission grants in the database
export const trackAutoRevokeNoticeAction = (event: AutoRevokeNoticeEvent) => {
  analytics.track('Auto-Revoke Notice Action', event);
};
