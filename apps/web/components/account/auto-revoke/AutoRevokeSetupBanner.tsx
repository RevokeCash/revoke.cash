'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import Href from 'components/common/Href';
import NoticeBanner from 'components/common/NoticeBanner';
import { trackAutoRevokeNoticeAction } from 'lib/utils/auto-revoke-notice';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import type { Address } from 'viem';

interface Props {
  account: Address;
  location: 'dashboard' | 'account';
  onDismiss?: () => void;
}

const AutoRevokeSetupBanner = ({ account, location, onDismiss }: Props) => {
  const t = useTranslations();

  const track = (action: 'view' | 'click' | 'learn_more' | 'dismiss') => {
    trackAutoRevokeNoticeAction({ action, notice: 'setup_needed', location, account });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: A view is tracked once per mount
  useEffect(() => {
    track('view');
  }, []);

  const dismiss = () => {
    track('dismiss');
    onDismiss?.();
  };

  return (
    <NoticeBanner
      style="info"
      action={
        <div className="flex items-center gap-4">
          <Href
            href="/premium/automated-revoking"
            router
            underline="always"
            className="text-sm"
            onClick={() => track('learn_more')}
          >
            {t('common.buttons.learn_more')}
          </Href>
          <Button style="secondary" size="sm" href="/account/auto-revoke" router onClick={() => track('click')}>
            {t('account.auto_revoke.setup.banner_cta')}
          </Button>
          {onDismiss && (
            <Button
              style="none"
              size="none"
              onClick={dismiss}
              aria-label={t('common.buttons.close')}
              className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          )}
        </div>
      }
    >
      {t('account.auto_revoke.setup.banner')}
    </NoticeBanner>
  );
};

export default AutoRevokeSetupBanner;
