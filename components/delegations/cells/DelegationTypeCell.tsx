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

  let typeLabel = '';
  if (delegation)
    switch (delegation.type) {
      case 'ALL':
        typeLabel = t('address.delegations.types.all');
        break;
      case 'CONTRACT':
        typeLabel = t('address.delegations.types.contract');
        break;
      case 'TOKEN':
        typeLabel = t('address.delegations.types.token');
        break;
      case 'ERC721':
        typeLabel = 'NFT';
        break;
      default:
        typeLabel = delegation.type;
    }

  const tooltipText = (() => {
    switch (delegation.type) {
      case 'ALL':
        return t('address.delegations.tooltips.all');
      case 'CONTRACT':
        return t('address.delegations.tooltips.contract');
      case 'TOKEN':
        return t('address.delegations.tooltips.token');
      case 'ERC721':
        return t('address.delegations.tooltips.erc721');
      case 'ERC1155':
        return t('address.delegations.tooltips.erc1155');
      case 'ERC20':
        return t('address.delegations.tooltips.erc20');
      default:
        return '';
    }
  })();

  const bgClasses = (() => {
    switch (delegation.type) {
      case 'ALL':
        return 'bg-zinc-100 dark:bg-zinc-800';
      case 'CONTRACT':
        return 'bg-zinc-200 dark:bg-zinc-700';
      case 'TOKEN':
        return 'bg-zinc-300 dark:bg-zinc-600';
      case 'ERC721':
        return 'bg-zinc-200 dark:bg-zinc-600';
      case 'ERC1155':
        return 'bg-zinc-200 dark:bg-zinc-600';
      default:
        return 'bg-zinc-100 dark:bg-zinc-500';
    }
  })();

  const widthClass = 'w-16';
  const classes = twMerge(widthClass, bgClasses);
  return (
    <div className="flex justify-start">
      {tooltipText ? (
        <WithHoverTooltip tooltip={tooltipText}>
          <Label className={classes}>{typeLabel}</Label>
        </WithHoverTooltip>
      ) : (
        <Label className={classes}>{typeLabel}</Label>
      )}
    </div>
  );
};

export default DelegationTypeCell;
