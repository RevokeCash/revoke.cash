'use client';

import Card, { CardTitle } from 'components/common/Card';
import { useFairsideCoverage } from 'lib/hooks/ethereum/coverage/useFairsideCoverage';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';
import ActiveCoverage from './ActiveCoverage';
import NoActiveCoverage from './NoActiveCoverage';

interface Props {
  account: Address;
}

const CoverageSection = ({ account }: Props) => {
  const t = useTranslations();
  const { isActive, isMembershipLoading } = useFairsideCoverage(account);

  return (
    <Card
      header={<CardTitle title={t('account.coverage.title')} />}
      isLoading={isMembershipLoading}
      className={isMembershipLoading ? 'h-32' : undefined}
    >
      {isActive ? <ActiveCoverage account={account} /> : <NoActiveCoverage />}
    </Card>
  );
};

export default CoverageSection;
