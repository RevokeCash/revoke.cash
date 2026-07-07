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
    <Label
      className={twMerge(
        'gap-1 bg-linear-to-r from-zinc-700 to-zinc-950 text-white dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-900',
        className,
      )}
    >
      <ShieldCheckIcon className="w-3 h-3" />
      <span>{t('common.labels.ultimate')}</span>
    </Label>
  );
};

export default UltimateBadge;
