'use client';

import { ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { CHROME_EXTENSION_URL } from '@revoke.cash/core/constants';
import Button from 'components/common/Button';
import StatusLabel from 'components/common/StatusLabel';
import { useExtensionConfig } from 'lib/hooks/ethereum/useExtensionConfig';
import { useTranslations } from 'next-intl';

const ExtensionCoverageSection = () => {
  const t = useTranslations();
  const { isInstalled, config } = useExtensionConfig();

  const isActive = isInstalled && config?.tier === 'standard';

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            {isActive ? (
              <ShieldCheckIcon className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            ) : (
              <ShieldExclamationIcon className="h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400" />
            )}
            <span className="font-medium">{t('account.coverage.extension.title')}</span>
          </div>
          <div className="flex items-center gap-2">
            {isActive ? (
              <StatusLabel status="success">{t('account.coverage.active')}</StatusLabel>
            ) : (
              <StatusLabel status="neutral">{t('account.coverage.inactive')}</StatusLabel>
            )}
            {isInstalled && <StatusLabel status="neutral">v{config!.version}</StatusLabel>}
          </div>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {!isInstalled
            ? t('account.coverage.extension.not_installed_description')
            : config?.tier === 'lite'
              ? t('account.coverage.extension.lite_description')
              : t('account.coverage.extension.standard_description')}
        </p>
      </div>
      {!isInstalled && (
        <Button style="secondary" size="sm" href={CHROME_EXTENSION_URL} external className="w-fit">
          {t('account.coverage.extension.get_extension')}
        </Button>
      )}
    </div>
  );
};

export default ExtensionCoverageSection;
