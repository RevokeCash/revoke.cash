import { MagnifyingGlassCircleIcon, ShieldExclamationIcon, WalletIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type React from 'react';
import { twMerge } from 'tailwind-merge';
import FullWidthLandingSection from './FullWidthLandingSection';

const FeaturesShowcase = () => {
  const t = useTranslations();

  return (
    <FullWidthLandingSection title={t('landing.features.title')}>
      <Feature
        featureKey="dashboard"
        icon={WalletIcon}
        image="/assets/images/landing/dashboard.jpg"
        imagePosition="left"
      />
      <Feature
        featureKey="extension"
        icon={ShieldExclamationIcon}
        image="/assets/images/landing/browser-extension.jpg"
        imagePosition="right"
      />
      <Feature
        featureKey="exploit_checker"
        icon={MagnifyingGlassCircleIcon}
        image="/assets/images/landing/exploit-checker.jpg"
        imagePosition="left"
      />
    </FullWidthLandingSection>
  );
};

export default FeaturesShowcase;

export interface FeatureProps {
  featureKey: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  image: string;
  imagePosition: 'left' | 'right';
  translationPrefix?: string;
}

export const Feature = ({
  featureKey,
  icon: Icon,
  image,
  imagePosition,
  translationPrefix = 'landing.features',
}: FeatureProps) => {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-1 gap-8 rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:grid-cols-[1.05fr_0.95fr] sm:p-6">
      <div
        className={twMerge(
          'relative w-full aspect-1200/630 overflow-hidden rounded-[1.35rem] border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900',
          imagePosition === 'right' && 'sm:order-2',
        )}
      >
        <Image
          src={image}
          alt={t(`${translationPrefix}.${featureKey}.title`)}
          width={1200}
          height={630}
          className="object-cover"
        />
      </div>
      <div className="flex flex-col justify-center gap-4">
        <div className="flex items-center gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-semibold">{t(`${translationPrefix}.${featureKey}.title`)}</h3>
        </div>
        <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
          {t(`${translationPrefix}.${featureKey}.description`)}
        </p>
      </div>
    </div>
  );
};
