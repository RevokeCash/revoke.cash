import FadeIn from 'components/common/FadeIn';
import Href from 'components/common/Href';
import Label from 'components/common/Label';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type React from 'react';
import { twMerge } from 'tailwind-merge';
import FullWidthLandingSection from './FullWidthLandingSection';

const FeaturesShowcase = () => {
  const t = useTranslations();

  return (
    <FullWidthLandingSection title={t('landing.features.title')}>
      <Feature featureKey="dashboard" image="/assets/images/landing/dashboard.jpg" imagePosition="left" />
      <Feature featureKey="extension" image="/assets/images/landing/browser-extension.jpg" imagePosition="right" />
      <Feature featureKey="exploit_checker" image="/assets/images/landing/exploit-checker.jpg" imagePosition="left" />
    </FullWidthLandingSection>
  );
};

export default FeaturesShowcase;

export interface FeatureProps {
  featureKey: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  image: string;
  imagePosition: 'left' | 'right';
  translationPrefix?: string;
  badge?: string;
  link?: { href: string; label: string };
}

export const Feature = ({
  featureKey,
  image,
  imagePosition,
  translationPrefix = 'landing.features',
  badge,
  link,
}: FeatureProps) => {
  const t = useTranslations();

  return (
    <FadeIn className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:grid md:grid-cols-[1.05fr_0.95fr]">
      <div
        className={twMerge(
          'relative w-full aspect-1200/630 md:aspect-auto overflow-hidden bg-zinc-50 dark:bg-zinc-900 border-b md:border-b-0 border-zinc-200 dark:border-zinc-800',
          imagePosition === 'left' && 'md:border-r',
          imagePosition === 'right' && 'md:order-2 md:border-l',
        )}
      >
        <Image
          src={image}
          alt={t(`${translationPrefix}.${featureKey}.title`)}
          width={1200}
          height={630}
          className="object-cover w-full h-full"
        />
      </div>
      <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-semibold">{t(`${translationPrefix}.${featureKey}.title`)}</h3>
          {badge && <Label className="w-fit bg-zinc-900 text-white dark:bg-zinc-200 dark:text-zinc-900">{badge}</Label>}
        </div>
        <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
          {t(`${translationPrefix}.${featureKey}.description`)}
        </p>
        {link && (
          <Href href={link.href} router underline="always" className="w-fit text-base font-medium">
            {link.label} →
          </Href>
        )}
      </div>
    </FadeIn>
  );
};
