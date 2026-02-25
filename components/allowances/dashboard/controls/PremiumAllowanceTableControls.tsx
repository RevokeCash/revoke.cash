'use client';

import type { ColumnSort } from '@tanstack/react-table';
import Button from 'components/common/Button';
import Chevron from 'components/common/Chevron';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { twMerge } from 'tailwind-merge';
import WalletHealthSection from '../wallet-health/WalletHealthSection';
import AllowanceSearchBox from './AllowanceSearchBox';
import SortSelect from './SortSelect';

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
      <div className="flex flex-col-reverse sm:flex-row justify-start gap-2">
        <div className="flex flex-col justify-start gap-2 grow">
          <SortSelect instanceId="premium-sort-select" onSortChange={onSortChange} />
          <div className="flex flex-row justify-start gap-2">
            <Suspense>
              <AllowanceSearchBox id="premium-spender-search" onSearchValuesChange={onSearchValuesChange} />
            </Suspense>
            <ExpandAllButton isAllExpanded={isAllExpanded} onToggleExpandAll={onToggleExpandAll} />
          </div>
        </div>
        <WalletHealthSection isPremium />
      </div>
    </div>
  );
};

export default PremiumAllowanceTableControls;

const ExpandAllButton = ({ isAllExpanded, onToggleExpandAll }: Pick<Props, 'isAllExpanded' | 'onToggleExpandAll'>) => {
  const t = useTranslations();

  return (
    <Button size="md" style="secondary" onClick={onToggleExpandAll} className="h-9 px-3 text-sm gap-1.5 justify-center">
      {isAllExpanded ? t('common.buttons.collapse_all') : t('common.buttons.expand_all')}
      <Chevron
        className={twMerge('w-5 h-5 transition-transform shrink-0', isAllExpanded ? 'rotate-180' : 'rotate-0')}
      />
    </Button>
  );
};
