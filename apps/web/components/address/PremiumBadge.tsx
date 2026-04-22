import { SparklesIcon } from '@heroicons/react/24/solid';
import Label from 'components/common/Label';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props {
  className?: string;
}

const PremiumBadge = ({ className }: Props) => {
  const t = useTranslations();

  return (
    <Label
      className={twMerge(
        'gap-1 bg-linear-to-r from-amber-300 to-brand text-zinc-900 dark:from-brand dark:to-amber-500 dark:text-zinc-900',
        className,
      )}
    >
      <SparklesIcon className="w-3 h-3" />
      <span>{t('common.labels.premium')}</span>
    </Label>
  );
};

export default PremiumBadge;
