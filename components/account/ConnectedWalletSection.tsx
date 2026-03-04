import Button from 'components/common/Button';
import { useNameLookup } from 'lib/hooks/ethereum/useNameLookup';
import { usePremiumSubscriptions } from 'lib/hooks/premium/usePremiumSubscriptions';
import { shortenAddress } from 'lib/utils/formatting';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';

interface Props {
  account: Address;
  chainId: number | undefined;
}

const ConnectedWalletSection = ({ account, chainId }: Props) => {
  const t = useTranslations();
  const { domainName } = useNameLookup(account);
  const { isAnyActive } = usePremiumSubscriptions(account, true);

  return (
    <section className="rounded-lg border border-black dark:border-white p-5 md:p-6 flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Connected wallet</h2>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Wallet</span>
        <span className="font-medium">{domainName ?? shortenAddress(account, 4)}</span>
        {domainName && <span className="text-sm font-mono break-all text-zinc-600 dark:text-zinc-400">{account}</span>}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          href={`/address/${account}${chainId ? `?chainId=${chainId}` : ''}`}
          router
          retainSearchParams={['chainId']}
          style="secondary"
          size="md"
          className="w-fit"
        >
          {t('common.buttons.my_allowances')}
        </Button>

        {isAnyActive && (
          <span className="text-xs font-medium px-2 py-1 rounded-md bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100 self-center">
            Premium active
          </span>
        )}
      </div>
    </section>
  );
};

export default ConnectedWalletSection;
