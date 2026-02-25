import { SparklesIcon } from '@heroicons/react/24/solid';
import Label from 'components/common/Label';

const PremiumBadge = () => {
  return (
    <Label className="gap-1 bg-linear-to-r from-amber-300 to-brand text-zinc-900 dark:from-brand dark:to-amber-500 dark:text-zinc-900">
      <SparklesIcon className="w-3 h-3" />
      <span>Premium</span>
    </Label>
  );
};

export default PremiumBadge;
