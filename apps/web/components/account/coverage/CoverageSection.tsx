'use client';

import Card, { CardTitle } from 'components/common/Card';
import { useFairsideCoverage } from 'lib/hooks/ethereum/coverage/useFairsideCoverage';
import { useExtensionConfig } from 'lib/hooks/ethereum/useExtensionConfig';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';
import ExtensionCoverageSection from './ExtensionCoverageSection';
import FairsideCoverageSection from './fairside/FairsideCoverageSection';

interface Props {
  account: Address;
}

const CoverageSection = ({ account }: Props) => {
  const t = useTranslations();
  const { isMembershipLoading } = useFairsideCoverage(account);
  const { isLoading: isExtensionLoading } = useExtensionConfig();

  const isLoading = isMembershipLoading || isExtensionLoading;

  return (
    <Card
      header={<CardTitle title={t('account.coverage.title')} />}
      isLoading={isLoading}
      className={isLoading ? 'h-32' : undefined}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ExtensionCoverageSection />
        <div className="min-w-0 border-t border-zinc-200 dark:border-zinc-800 pt-4 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-6">
          <FairsideCoverageSection account={account} />
        </div>
      </div>
    </Card>
  );
};

export default CoverageSection;
