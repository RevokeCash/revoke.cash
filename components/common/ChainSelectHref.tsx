import ChainLogo from 'components/common/ChainLogo';
import { CHAIN_SELECT_MAINNETS, CHAIN_SELECT_TESTNETS, getChainName, isSupportedChain } from 'lib/utils/chains';
import useTranslation from 'next-translate/useTranslation';
import { twMerge } from 'tailwind-merge';
import DropdownMenu, { DropdownMenuItem } from './DropdownMenu';

interface Props {
  selected: number;
  getUrl: (chainId: number) => string;
  chainIds?: number[];
}

// This component is designed to match the styling of the ChainSelect component,
// byt it uses a HeadlessUI DropdownMenu instead of a Select component.
const ChainSelectHref = ({ selected, chainIds, getUrl }: Props) => {
  const { t } = useTranslation();

  const mainnetOptions = (chainIds ?? CHAIN_SELECT_MAINNETS).map((chainId) => ({
    value: getChainName(chainId),
    chainId,
  }));

  const testnetOptions = CHAIN_SELECT_TESTNETS.map((chainId) => ({
    value: getChainName(chainId),
    chainId,
  }));

  const groups = [
    {
      label: t('common:chain_select.mainnets'),
      options: mainnetOptions,
    },
    {
      label: t('common:chain_select.testnets'),
      options: testnetOptions,
    },
  ];

  return (
    <DropdownMenu menuButton={<ChainDisplay chainId={selected} />} buttonClassName="px-2 h-9" itemsClassName="w-58">
      {groups.map((group) => (
        <div key={group.label}>
          <div className="uppercase text-xs leading-tight p-3 pb-0 mb-[3px] font-medium">{group.label}</div>
          {group.options.map((option) => (
            <DropdownMenuItem
              key={option.chainId}
              href={getUrl(option.chainId)}
              className={twMerge(
                'flex items-center gap-1 p-2 h-10',
                option.chainId === selected && 'bg-zinc-200 dark:bg-zinc-800',
              )}
            >
              <ChainDisplay chainId={option.chainId} />
            </DropdownMenuItem>
          ))}
        </div>
      ))}
    </DropdownMenu>
  );
};

const ChainDisplay = ({ chainId }: { chainId: number }) => {
  return (
    <div className={twMerge('flex items-center gap-1')}>
      <ChainLogo size={24} chainId={chainId} />
      <div>{getChainName(chainId)}</div>
    </div>
  );
};

export default ChainSelectHref;
