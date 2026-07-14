'use client';

import type { ColumnSort } from '@tanstack/react-table';
import Button from 'components/common/Button';
import Chevron from 'components/common/Chevron';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import AllowanceTableControls from './AllowanceTableControls';

// Time machine is hidden until its standalone launch
// import TimeMachineBanner from './TimeMachineBanner';
// import TimeMachineModalWithButton from './TimeMachineModalWithButton';

interface Props {
  onSortChange: (sort: ColumnSort[]) => void;
  onSearchValuesChange: (values: string[]) => void;
  onToggleExpandAll: () => void;
  isAllExpanded: boolean;
}

const PremiumAllowanceTableControls = ({
  onSortChange,
  onSearchValuesChange,
  onToggleExpandAll,
  isAllExpanded,
}: Props) => {
  return (
    <div className="flex flex-col gap-2">
      {/* <TimeMachineBanner /> */}
      <AllowanceTableControls onSearchValuesChange={onSearchValuesChange} onSortChange={onSortChange}>
        <div className="flex flex-wrap w-full gap-2 sm:w-auto">
          {/* <TimeMachineModalWithButton /> */}
          <ExpandAllButton isAllExpanded={isAllExpanded} onToggleExpandAll={onToggleExpandAll} />
        </div>
      </AllowanceTableControls>
    </div>
  );
};

export default PremiumAllowanceTableControls;

const ExpandAllButton = ({ isAllExpanded, onToggleExpandAll }: Pick<Props, 'isAllExpanded' | 'onToggleExpandAll'>) => {
  const t = useTranslations();

  return (
    <Button
      size="md"
      style="secondary"
      onClick={onToggleExpandAll}
      className="h-9 px-4 text-sm gap-1.5 justify-between grow basis-36 sm:grow-0 sm:basis-auto sm:w-40"
    >
      {isAllExpanded ? t('common.buttons.collapse_all') : t('common.buttons.expand_all')}
      <Chevron
        className={twMerge(
          'w-5 h-5 transition-transform shrink-0 fill-black dark:fill-white',
          isAllExpanded ? 'rotate-180' : 'rotate-0',
        )}
      />
    </Button>
  );
};
