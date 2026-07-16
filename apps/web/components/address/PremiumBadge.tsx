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
    <Label className={twMerge('gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-brand', className)}>
      <SparklesIcon className="w-3 h-3" />
      <span>{t('common.labels.premium')}</span>
    </Label>
  );
};

export default PremiumBadge;
