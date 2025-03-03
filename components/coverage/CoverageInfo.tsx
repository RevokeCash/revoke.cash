'use client';

import { ChainId } from '@revoke.cash/chains';
import Button from 'components/common/Button';
import Card from 'components/common/Card';
import ModalWithButton from 'components/common/ModalWithButton';
import { getChainName } from 'lib/utils/chains';
import { useTranslations } from 'next-intl';
import CoverageQuiz from './CoverageQuiz';
import IconWithInfo from './IconWithInfo';

const BlockchainList = ({ title, chains }: { title: string; chains: string[] }) => (
  <div className="flex flex-col gap-2">
    <h4 className="text-lg font-semibold">{title}</h4>
    <ul className="grid grid-cols-2 gap-2">
      {chains.map((chain) => (
        <li key={chain} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-brand" />
          {chain}
        </li>
      ))}
    </ul>
  </div>
);

interface CoverageItem {
  id: string;
  text: string;
}

const CoverageInfo = () => {
  const t = useTranslations('address.coverage');

  const coveredItems: CoverageItem[] = [
    { id: 'signatures', text: t('info.main.covered_items.signatures') },
    { id: 'poisoning', text: t('info.main.covered_items.poisoning') },
    { id: 'malware', text: t('info.main.covered_items.malware') },
  ];

  const notCoveredItems: CoverageItem[] = [
    { id: 'rug_pulls', text: t('info.main.not_covered_items.rug_pulls') },
    { id: 'seed_phrase', text: t('info.main.not_covered_items.seed_phrase') },
    { id: 'smart_contracts', text: t('info.main.not_covered_items.smart_contracts') },
  ];

  const supportedChains = {
    evm: [
      getChainName(ChainId.EthereumMainnet),
      getChainName(ChainId.Base),
      getChainName(ChainId.OPMainnet),
      getChainName(ChainId.ArbitrumOne),
      getChainName(ChainId['AvalancheC-Chain']),
      getChainName(ChainId.BNBSmartChainMainnet),
      getChainName(ChainId.PolygonMainnet),
      getChainName(ChainId.SonicMainnet),
    ],
    nonEvm: ['Bitcoin', 'Solana', 'TON'],
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-7xl mx-auto">
      <div>
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="w-full lg:w-2/3">
            <Card title={t('info.main.title')} className="flex flex-col gap-6">
              <p className="text-lg">{t('info.main.description')}</p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-bold">{t('info.main.covered_title')}</h3>
                  <div className="flex flex-col gap-2">
                    {coveredItems.map((item) => (
                      <IconWithInfo key={item.id} type="check" text={item.text} />
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-bold">{t('info.main.not_covered_title')}</h3>
                  <div className="flex flex-col gap-2">
                    {notCoveredItems.map((item) => (
                      <IconWithInfo key={item.id} type="x" text={item.text} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-bold">{t('info.important.title')}</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>{t('info.important.kyc')}</li>
                  <li>{t('info.important.coverage_amount')}</li>
                  <li>{t('info.important.fee')}</li>
                </ul>
              </div>

              <ModalWithButton
                className="w-full sm:max-w-2xl"
                button={
                  <Button style="primary" size="lg" className="self-center mt-4">
                    {t('info.quiz.start')}
                  </Button>
                }
              >
                <CoverageQuiz open={true} onClose={() => {}} />
              </ModalWithButton>
            </Card>
          </div>

          <div className="w-full lg:w-1/3 h-fit">
            <Card title={t('info.chains.title')} className="flex flex-col gap-6">
              <div className="flex flex-col gap-8">
                <BlockchainList title={t('info.chains.evm')} chains={supportedChains.evm} />
                <BlockchainList title={t('info.chains.non_evm')} chains={supportedChains.nonEvm} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverageInfo;
