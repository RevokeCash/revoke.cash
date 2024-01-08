import { InformationCircleIcon } from '@heroicons/react/24/outline';
import Card from 'components/common/Card';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useMarketplaces } from 'lib/hooks/ethereum/useMarketplaces';
import { useAddressAllowances, useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import useTranslation from 'next-translate/useTranslation';
import { useEffect, useLayoutEffect, useState } from 'react';
import { getSpenderData } from '../../../lib/utils/whois';
import Error from '../../common/Error';
import TableBodyLoader from '../../common/TableBodyLoader';
import MarketplaceEntry from './MarketplaceEntry';

const MarketplacePanel = () => {
  const ROW_HEIGHT = 52;
  const [loaderHeight, setLoaderHeight] = useState<number>(ROW_HEIGHT * 12);

  useLayoutEffect(() => {
    // 530 is around the size of the headers and controls (and at least 2 row also on small screens)
    setLoaderHeight(Math.max(window.innerHeight - 530, 2 * ROW_HEIGHT + 68));
  }, []);

  const { t } = useTranslation();
  const { selectedChainId } = useAddressPageContext();
  const marketplaces = useMarketplaces(selectedChainId);
  const { allowances, error: allowancesError, isLoading: isAllowancesLoading } = useAddressAllowances();
  const [spenderNames, setSpenderNames] = useState<string[]>([]);
  const [namesFetched, setNamesFetched] = useState(false); // New state variable

  useEffect(() => {
    (async () => {
      try {
        const names = await Promise.all(
          allowances.map(async (allowance) => {
            try {
              const spenderData = await getSpenderData(allowance.spender, selectedChainId);
              return spenderData?.name || null;
            } catch (error) {
              console.error('Error fetching spender names:', error);
              return null;
            }
          }),
        );

        setSpenderNames(names.filter((name) => name !== null) as string[]);
        setNamesFetched(true); // New state variable
      } catch (error) {
        console.error('Error fetching spender names:', error);
      }
    })();
  }, [allowances, selectedChainId]);

  const title = (
    <div className="flex items-center gap-2">
      <div>{t('address:signatures.marketplaces.title')}</div>
      <WithHoverTooltip tooltip={t('address:tooltips.marketplace_signatures')}>
        <div>
          <InformationCircleIcon className="w-4 h-4" />
        </div>
      </WithHoverTooltip>
    </div>
  );

  if (allowancesError) {
    return (
      <Card title={title} className="w-full flex justify-center items-center h-12">
        <Error error={allowancesError} />
      </Card>
    );
  }

  const isLoading = isAllowancesLoading || (!namesFetched && spenderNames.length === 0);
  const filteredMarketplaces = marketplaces.filter((marketplace) => spenderNames.includes(marketplace.name));

  if (isLoading) {
    return (
      <Card title={title} className="w-full p-0">
        <table className="w-full border-collapse">
          <TableBodyLoader columns={1} rows={Math.floor(loaderHeight / ROW_HEIGHT)} className="max-sm:hidden" />
          <TableBodyLoader columns={1} rows={Math.floor((loaderHeight - 68) / ROW_HEIGHT)} className="sm:hidden" />
        </table>
      </Card>
    );
  }

  if (filteredMarketplaces.length === 0) {
    return (
      <Card title={title} className="w-full flex justify-center items-center h-12">
        <p className="text-center">{t('address:signatures.marketplaces.none_found')}</p>
      </Card>
    );
  }

  return (
    <Card title={title} className="p-0 overflow-x-scroll whitespace-nowrap scrollbar-hide">
      <div className="w-full">
        {filteredMarketplaces.map((marketplace) => (
          <MarketplaceEntry key={marketplace.name} marketplace={marketplace} />
        ))}
      </div>
    </Card>
  );
};

export default MarketplacePanel;
