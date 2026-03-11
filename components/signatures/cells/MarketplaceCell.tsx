import Logo from 'components/common/Logo';
import type { Marketplace } from 'lib/interfaces';
import { useTranslations } from 'next-intl';

interface Props {
  marketplace: Marketplace;
}

const MarketplaceCell = ({ marketplace }: Props) => {
  const t = useTranslations();

  return (
    <div className="flex items-center gap-2 py-1 w-40 lg:w-56">
      <div className="flex flex-col items-start gap-0.5">
        <div className="flex items-center gap-2 ">
          <Logo src={marketplace.logo} alt={marketplace.name} size={24} border />
          <div>{marketplace.name}</div>
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 max-w-40 lg:max-w-56 truncate">
          {t('signatures.marketplace.table.active_approvals', { count: marketplace.allowances.length })}
        </div>
      </div>
    </div>
  );
};

export default MarketplaceCell;
