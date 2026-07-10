'use client';

import { InformationCircleIcon } from '@heroicons/react/24/outline';
import WithHoverTooltip from 'components/common/WithHoverTooltip';

interface Props {
  tooltip: string;
}

const InformationIconTooltip = ({ tooltip }: Props) => {
  return (
    <WithHoverTooltip tooltip={tooltip}>
      <InformationCircleIcon className="w-3.5 h-3.5 shrink-0 text-zinc-500 dark:text-zinc-500 cursor-help" />
    </WithHoverTooltip>
  );
};

export default InformationIconTooltip;
