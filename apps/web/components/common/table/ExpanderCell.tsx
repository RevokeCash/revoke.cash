import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { Row } from '@tanstack/react-table';
import Button from 'components/common/Button';
import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props<TData> {
  row: Row<TData>;
  // Rendered before the expand toggle, e.g. per-row action buttons
  children?: ReactNode;
}

const ExpanderCell = <TData,>({ row, children }: Props<TData>) => (
  <div className="flex items-center justify-end gap-2 py-1.5 text-sm">
    {children}
    <Button style="tertiary" size="sm" onClick={row.getToggleExpandedHandler()} aria-label="Toggle details">
      <ChevronDownIcon className={twMerge('w-4 h-4 duration-150', row.getIsExpanded() && 'rotate-180')} />
    </Button>
  </div>
);

export default ExpanderCell;
