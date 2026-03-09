import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props {
  sectionKey: string;
  image: string;
  imagePosition: 'left' | 'right';
}

const FeatureSection = ({ sectionKey, image, imagePosition }: Props) => {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
      <div
        className={twMerge(
          'relative w-full aspect-1200/630 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700',
          imagePosition === 'right' && 'sm:order-2',
        )}
      >
        <Image
          src={image}
          alt={t(`premium.pricing.feature_sections.${sectionKey}.title`)}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex flex-col justify-center gap-3">
        <h3 className="text-xl font-semibold">{t(`premium.pricing.feature_sections.${sectionKey}.title`)}</h3>
        <p className="text-zinc-600 dark:text-zinc-400">
          {t(`premium.pricing.feature_sections.${sectionKey}.description`)}
        </p>
      </div>
    </div>
  );
};

export default FeatureSection;
