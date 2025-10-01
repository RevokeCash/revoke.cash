'use client';

import { ChainId } from '@revoke.cash/chains';
import Button from 'components/common/Button';
import Card from 'components/common/Card';
import GridList from 'components/common/list/GridList';
import ListItem from 'components/common/list/ListItem';
import ModalWithButton from 'components/common/ModalWithButton';
import { getChainName } from 'lib/utils/chains';
import { useTranslations } from 'next-intl';
import CoverageQuiz from './CoverageQuiz';
import IconWithInfo from './IconWithInfo';

const CoverageInfo = () => {
  const t = useTranslations('address.coverage');

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="w-full lg:w-2/3">
          <Card title={t('info.main.title')} className="flex flex-col gap-2">
            <p>{t('info.main.description')}</p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold">{t('info.main.covered_title')}</h3>
                <div className="flex flex-col gap-2">
                  <IconWithInfo type="check" text={t('info.main.covered_items.signatures')} />
                  <IconWithInfo type="check" text={t('info.main.covered_items.poisoning')} />
                  <IconWithInfo type="check" text={t('info.main.covered_items.malware')} />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold">{t('info.main.not_covered_title')}</h3>
                <div className="flex flex-col gap-2">
                  <IconWithInfo type="x" text={t('info.main.not_covered_items.rug_pulls')} />
                  <IconWithInfo type="x" text={t('info.main.not_covered_items.seed_phrase')} />
                  <IconWithInfo type="x" text={t('info.main.not_covered_items.smart_contracts')} />
                  <IconWithInfo type="x" text={t('info.main.not_covered_items.custodial-accounts')} />
                </div>
              </div>
            </div>

            <GridList title={t('info.important.title')} columns={1}>
              <ListItem>{t('info.important.kyc')}</ListItem>
              <ListItem>{t('info.important.coverage_amount')}</ListItem>
              <ListItem>{t('info.important.fee')}</ListItem>
              <ListItem>{t('info.important.wallets')}</ListItem>
            </GridList>

            <ModalWithButton
              className="w-full sm:max-w-2xl"
              button={
                <Button style="primary" size="lg" className="self-center my-2">
                  {t('info.quiz.start')}
                </Button>
              }
            >
              <CoverageQuiz />
            </ModalWithButton>
          </Card>
        </div>

        <div className="w-full lg:w-1/3 h-fit">
          <Card title={t('info.chains.title')} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <GridList title={t('info.chains.evm')} columns={2} className="text-sm">
                <ListItem>{getChainName(ChainId.EthereumMainnet)}</ListItem>
                <ListItem>{getChainName(ChainId.Base)}</ListItem>
                <ListItem>{getChainName(ChainId.OPMainnet)}</ListItem>
                <ListItem>{getChainName(ChainId.ArbitrumOne)}</ListItem>
                <ListItem>{getChainName(ChainId.Abstract)}</ListItem>
                <ListItem>{getChainName(ChainId['AvalancheC-Chain'])}</ListItem>
                <ListItem>{getChainName(ChainId.BNBSmartChainMainnet)}</ListItem>
                <ListItem>{getChainName(ChainId.PolygonMainnet)}</ListItem>
                <ListItem>{getChainName(ChainId.SonicMainnet)}</ListItem>
              </GridList>
              <GridList title={t('info.chains.non_evm')} columns={2} className="text-sm">
                <ListItem>Bitcoin</ListItem>
                <ListItem>Solana</ListItem>
                <ListItem>TON</ListItem>
              </GridList>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoverageInfo;
