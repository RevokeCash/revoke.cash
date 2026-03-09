import { CheckIcon } from '@heroicons/react/24/solid';
import Button from 'components/common/Button';
import { useTranslations } from 'next-intl';

const PremiumSection = () => {
  const t = useTranslations();

  return (
    <div className="w-full px-4">
      <div className="max-w-3xl mx-auto rounded-xl border border-brand/40 bg-brand/5 dark:bg-brand/10 p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2>{t('landing.premium.title')}</h2>
          <p className="text-zinc-600 dark:text-zinc-400">{t('landing.premium.description')}</p>
        </div>

        <ul className="flex flex-col sm:grid sm:grid-cols-2 gap-x-8 gap-y-2">
          <Highlight i18nKey="landing.premium.highlights.multichain_dashboard" />
          <Highlight i18nKey="landing.premium.highlights.unlimited_batch_revokes" />
          <Highlight i18nKey="landing.premium.highlights.multichain_exploit_checker" />
          <Highlight i18nKey="landing.premium.highlights.priority_support" />
          <Highlight i18nKey="landing.premium.highlights.multichain_history" />
          <Highlight i18nKey="landing.premium.highlights.address_slots" />
        </ul>

        <div className="flex flex-wrap gap-3">
          <Button href="/premium" router style="primary" size="md">
            {t('landing.premium.view_pricing')}
          </Button>
          <Button href="/account" router style="secondary" size="md">
            {t('landing.premium.subscribe_now')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PremiumSection;

const Highlight = ({ i18nKey }: { i18nKey: string }) => {
  const t = useTranslations();

  return (
    <li className="flex items-center gap-2 text-sm">
      <CheckIcon className="w-4 h-4 shrink-0 text-green-600 dark:text-green-400" />
      <span>{t(i18nKey)}</span>
    </li>
  );
};
