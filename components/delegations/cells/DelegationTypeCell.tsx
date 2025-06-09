'use client';
import Label from 'components/common/Label';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import type { Delegation } from 'lib/delegate/DelegatePlatform';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props {
  delegation: Delegation;
}

const DelegationTypeCell = ({ delegation }: Props) => {
  const t = useTranslations();

  const classes = twMerge(
    'w-16',
    delegation.type === 'ALL' && 'bg-zinc-100 dark:bg-zinc-800',
    delegation.type === 'CONTRACT' && 'bg-zinc-200 dark:bg-zinc-700',
    delegation.type === 'ERC721' && 'bg-zinc-300 dark:bg-zinc-600',
    delegation.type === 'ERC1155' && 'bg-zinc-400 dark:bg-zinc-500',
    delegation.type === 'ERC20' && 'bg-zinc-500 dark:bg-zinc-400 text-white',
  );

  return (
    <div className="flex justify-start">
      <WithHoverTooltip tooltip={t(`address.delegations.tooltips.${delegation.type.toLowerCase()}`)}>
        <Label className={classes}>{t(`address.delegations.types.${delegation.type.toLowerCase()}`)}</Label>
      </WithHoverTooltip>
    </div>
  );
};

export default DelegationTypeCell;
