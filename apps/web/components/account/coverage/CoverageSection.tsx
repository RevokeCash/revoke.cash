'use client';

import Card, { CardTitle } from 'components/common/Card';
import Divider from 'components/common/Divider';
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
      <div className="flex flex-col gap-4">
        <ExtensionCoverageSection />
        <Divider />
        <FairsideCoverageSection account={account} />
      </div>
    </Card>
  );
};

export default CoverageSection;
