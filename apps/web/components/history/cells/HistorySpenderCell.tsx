import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { PERMIT2_CANONICAL_ADDRESS } from '@revoke.cash/core/allowances/permit2';
import { DUMMY_ADDRESS } from '@revoke.cash/core/constants';
import type { Nullable } from '@revoke.cash/core/types';
import type { SpenderData } from '@revoke.cash/core/whois';
import AddressCell from 'components/allowances/dashboard/cells/AddressCell';
import Button from 'components/common/Button';
import StatusLabel from 'components/common/StatusLabel';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';

interface Props {
  address?: Address;
  chainId: number;
  spenderData?: Nullable<SpenderData>;
  permit2Address?: Address;
  onFilter?: (filterValue: string) => void;
}

const HistorySpenderCell = ({ address, spenderData, chainId, permit2Address, onFilter }: Props) => {
  const t = useTranslations();

  const handleFilterClick = () => {
    if (onFilter) {
      onFilter(`spender:${address}`);
    }
  };

  const filterButton = (
    <WithHoverTooltip tooltip={t('address.tooltips.filter_by_spender')}>
      <Button style="none" size="none" onClick={handleFilterClick} aria-label={`Filter by spender ${address}`}>
        <MagnifyingGlassIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200" />
      </Button>
    </WithHoverTooltip>
  );

  // "Cancel Permit signatures" are handles separately in the table; transfers without an attributed spender have nothing to display either
  if (!address || address === DUMMY_ADDRESS) return null;

  return (
    <div className="flex items-center gap-2">
      <AddressCell address={address} chainId={chainId} spenderData={spenderData ?? undefined} />
      {onFilter ? filterButton : null}
      {permit2Address ? (
        <WithHoverTooltip
          tooltip={
            permit2Address.toLowerCase() === PERMIT2_CANONICAL_ADDRESS.toLowerCase()
              ? t('address.history.via_permit2')
              : `${t('address.history.via_permit2')} (${permit2Address})`
          }
        >
          <StatusLabel status="neutral" className="py-0.5 text-xs whitespace-nowrap">
            Permit2
          </StatusLabel>
        </WithHoverTooltip>
      ) : null}
    </div>
  );
};

export default HistorySpenderCell;
