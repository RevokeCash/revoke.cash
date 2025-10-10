import { InformationCircleIcon } from '@heroicons/react/24/outline';
import Href from 'components/common/Href';
import RichText from 'components/common/RichText';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useNativeTokenPrice } from 'lib/hooks/ethereum/useNativeTokenPrice';
import { getChainName } from 'lib/utils/chains';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { BASE_FEE, FEE_SPONSORS, PER_ALLOWANCE_FEE } from './fee';

interface Props {
  chainId: number;
  feeDollarAmount: string;
}

const FeeNotice = ({ chainId, feeDollarAmount }: Props) => {
  const t = useTranslations();
  const { nativeTokenPrice } = useNativeTokenPrice(chainId);

  if (!nativeTokenPrice) return null;

  const sponsor = FEE_SPONSORS[chainId];

  if (sponsor) {
    return <SponsoredFeeNotice chainId={chainId} />;
  }

  const tooltipContent = (
    <RichText>
      {(tags) =>
        t.rich('address.batch_revoke.fee.tooltip', {
          ...tags,
          BASE_FEE: BASE_FEE.toFixed(2),
          PER_ALLOWANCE_FEE: PER_ALLOWANCE_FEE.toFixed(2),
        })
      }
    </RichText>
  );

  return (
    <div className="flex items-center justify-center gap-2 text-center text-sm text-zinc-600 dark:text-zinc-300 bg-brand/30 dark:bg-brand/20 py-4 px-6">
      <span>
        <RichText>
          {(tags) =>
            t.rich('address.batch_revoke.fee.notice', {
              ...tags,
              feeDollarAmount,
            })
          }
        </RichText>
      </span>
      <WithHoverTooltip tooltip={tooltipContent}>
        <InformationCircleIcon className="w-6 h-6 shrink-0" />
      </WithHoverTooltip>
    </div>
  );
};

export default FeeNotice;

interface SponsoredFeeNoticeProps {
  chainId: number;
}

const SponsoredFeeNotice = ({ chainId }: SponsoredFeeNoticeProps) => {
  const t = useTranslations();

  const chainName = getChainName(chainId);
  const sponsor = FEE_SPONSORS[chainId];

  if (!sponsor) return null;

  const sponsorTags = {
    sponsor: sponsor.name,
    chainName,
    'sponsor-link': (children: ReactNode) =>
      sponsor.url ? (
        <Href href={sponsor.url} external className="font-medium">
          {children}
        </Href>
      ) : (
        <span className="font-medium">{children}</span>
      ),
  };

  return (
    <div className="flex items-center justify-center gap-2 text-center text-sm text-zinc-600 dark:text-zinc-300 bg-brand/30 dark:bg-brand/20 py-4 px-6">
      <span>
        <RichText>
          {(tags) => t.rich('address.batch_revoke.fee.sponsored_notice', { ...tags, ...sponsorTags })}
        </RichText>
      </span>
    </div>
  );
};
