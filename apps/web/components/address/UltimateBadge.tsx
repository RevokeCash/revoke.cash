import { ShieldCheckIcon } from '@heroicons/react/24/solid';
import Label from 'components/common/Label';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props {
  className?: string;
}

const UltimateBadge = ({ className }: Props) => {
  const t = useTranslations();

  return (
    <Label className={twMerge('gap-1 bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100', className)}>
      <ShieldCheckIcon className="w-3 h-3" />
      <span>{t('common.labels.ultimate')}</span>
    </Label>
  );
};

export default UltimateBadge;
