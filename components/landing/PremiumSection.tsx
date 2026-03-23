import { CheckIcon } from '@heroicons/react/24/solid';
import Button from 'components/common/Button';
import FadeIn from 'components/common/FadeIn';
import Label from 'components/common/Label';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import FullWidthLandingSection from './FullWidthLandingSection';

const PremiumSection = () => {
  const t = useTranslations();

  return (
    <FullWidthLandingSection title={t('landing.premium.title')} size="md">
      <p className="-mt-4 text-center text-lg text-zinc-600 dark:text-zinc-400">{t('landing.premium.description')}</p>
      <FadeIn stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <PremiumSectionCard
          title={t('landing.premium.free_title')}
          badge={
            <Label className="border border-zinc-300 px-3 py-1 font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
              {t('common.buttons.get_started')}
            </Label>
          }
        >
          <ul className="flex flex-col gap-2">
            <Highlight i18nKey="landing.premium.free_features.single_chain" />
            <Highlight i18nKey="landing.premium.free_features.history" />
            <Highlight i18nKey="landing.premium.free_features.exploit_checker" />
            <Highlight i18nKey="landing.premium.free_features.batch_revoke" />
          </ul>
          <div className="mt-auto pt-2">
            <Button href="/token-approval-checker/ethereum" router style="secondary" size="md" className="w-full">
              {t('common.buttons.get_started')}
            </Button>
          </div>
        </PremiumSectionCard>
        <PremiumSectionCard
          title={t('landing.premium.premium_title')}
          badge={<Label className="bg-brand px-3 py-1 text-black">{t('landing.premium.starting_at')}</Label>}
          highlighted
        >
          <ul className="flex flex-col gap-2">
            <Highlight i18nKey="landing.premium.highlights.multichain_dashboard" />
            <Highlight i18nKey="landing.premium.highlights.multichain_history" />
            <Highlight i18nKey="landing.premium.highlights.multichain_exploit_checker" />
            <Highlight i18nKey="landing.premium.highlights.unlimited_batch_revokes" />
            <Highlight i18nKey="landing.premium.highlights.time_machine" />
            <Highlight i18nKey="landing.premium.highlights.address_slots" />
          </ul>
          <div className="mt-auto pt-2">
            <Button href="/premium" router style="primary" size="md" className="w-full">
              {t('landing.premium.view_pricing')}
            </Button>
          </div>
        </PremiumSectionCard>
      </FadeIn>
    </FullWidthLandingSection>
  );
};

export default PremiumSection;

interface PremiumSectionCardProps {
  title: string;
  badge: ReactNode;
  highlighted?: boolean;
  children: ReactNode;
}

const PremiumSectionCard = ({ title, badge, highlighted = false, children }: PremiumSectionCardProps) => {
  return (
    <div
      className={twMerge(
        'flex flex-col gap-5 rounded-3xl p-6',
        highlighted
          ? 'border-2 border-brand/70 bg-brand/[0.03] dark:border-brand/50 dark:bg-brand/[0.04]'
          : 'border border-zinc-200/70 bg-zinc-50/50 dark:border-zinc-800/70 dark:bg-zinc-900/30',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold">{title}</h3>
        {badge}
      </div>
      {children}
    </div>
  );
};

const Highlight = ({ i18nKey }: { i18nKey: string }) => {
  const t = useTranslations();

  return (
    <li className="flex items-center gap-2 text-sm">
      <CheckIcon className="w-4 h-4 shrink-0 text-green-600 dark:text-green-400" />
      <span>{t(i18nKey)}</span>
    </li>
  );
};
