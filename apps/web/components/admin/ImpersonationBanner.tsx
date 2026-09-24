'use client';

import { EyeIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import NoticeBanner from 'components/common/NoticeBanner';
import { useStopImpersonation } from 'lib/hooks/admin/useAdminImpersonation';
import { useAuthSession } from 'lib/hooks/auth/useAuthSession';

// Shown on every page while the admin views the site as another user, so impersonation is never left on unnoticed
const ImpersonationBanner = () => {
  const { siweAddress, isImpersonating } = useAuthSession();
  const stopImpersonation = useStopImpersonation();

  if (!isImpersonating || !siweAddress) return null;

  const handleStop = () => {
    stopImpersonation.mutate(undefined, {
      onSuccess: () => window.location.assign(`/admin/lookup/${siweAddress}`),
    });
  };

  return (
    <NoticeBanner
      style="warning"
      icon={EyeIcon}
      className="rounded-none border-x-0 border-t-0"
      action={
        <Button style="secondary" size="sm" onClick={handleStop} loading={stopImpersonation.isPending}>
          Stop impersonating
        </Button>
      }
    >
      Viewing the site as <span className="font-mono break-all">{siweAddress}</span>. Write actions are disabled.
    </NoticeBanner>
  );
};

export default ImpersonationBanner;
