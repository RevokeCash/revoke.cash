import Button from 'components/common/Button';
import Card, { CardTitle } from 'components/common/Card';
import { useNameLookup } from 'lib/hooks/ethereum/useNameLookup';
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

  return (
    <Card header={<CardTitle title="Connected wallet" />} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Wallet</span>
        <span className="font-medium">{domainName ?? shortenAddress(account, 4)}</span>
        {domainName && <span className="text-sm font-mono break-all text-zinc-600 dark:text-zinc-400">{account}</span>}
      </div>

      <div className="flex flex-wrap gap-2">
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
      </div>
    </Card>
  );
};

export default ConnectedWalletSection;
