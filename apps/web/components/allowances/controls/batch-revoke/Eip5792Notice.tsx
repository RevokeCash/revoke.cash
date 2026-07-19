import { getChainName } from '@revoke.cash/core/chains';
import RichText from 'components/common/RichText';
import { useWalletCapabilities } from 'lib/hooks/ethereum/useWalletCapabilities';
import { useTranslations } from 'next-intl';

interface Props {
  chainId: number;
  allowanceCount: number;
}

const Eip5792Notice = ({ chainId, allowanceCount }: Props) => {
  const t = useTranslations();
  const walletCapabilities = useWalletCapabilities(chainId);

  const content = (() => {
    if (walletCapabilities.isLoading) return null;

    if (!walletCapabilities?.capabilities) {
      return (
        <RichText>
          {(tags) => t.rich('address.batch_revoke.eip5792_notice', { ...tags, count: allowanceCount })}
        </RichText>
      );
    }

    if (!walletCapabilities?.supportsEip5792) {
      return (
        <RichText>
          {(tags) =>
            t.rich('address.batch_revoke.eip5792_notice_chain', {
              ...tags,
              chainName: getChainName(chainId),
              count: allowanceCount,
            })
          }
        </RichText>
      );
    }

    return null;
  })();

  if (!content) return null;

  return (
    <div className="flex items-center justify-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 bg-brand/30 dark:bg-brand/20 text-center py-2 px-4 max-w-xl">
      {content}
    </div>
  );
};

export default Eip5792Notice;
