'use client';

import type { ColumnSort } from '@tanstack/react-table';
import Button from 'components/common/Button';
import Chevron from 'components/common/Chevron';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { twMerge } from 'tailwind-merge';
import AllowanceSearchBox from './AllowanceSearchBox';
import SortSelect from './SortSelect';
import TimeMachineBanner from './TimeMachineBanner';
import TimeMachineModalWithButton from './TimeMachineModalWithButton';

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
      <TimeMachineBanner />
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex flex-col gap-2 grow">
          <SortSelect instanceId="premium-sort-select" onSortChange={onSortChange} />
          <Suspense>
            <AllowanceSearchBox id="premium-spender-search" onSearchValuesChange={onSearchValuesChange} />
          </Suspense>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <TimeMachineModalWithButton />
          <ExpandAllButton isAllExpanded={isAllExpanded} onToggleExpandAll={onToggleExpandAll} />
        </div>
      </div>
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
      className="h-9 px-4 text-sm gap-1.5 justify-between w-full sm:w-40"
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
