'use client';

import Button from 'components/common/Button';
import Card from 'components/common/Card';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import CoverageQuiz from './CoverageQuiz';
import IconWithInfo from './IconWithInfo';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswers: string[];
  explanation: string;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 'coverage',
    question: 'When am I covered?',
    options: [
      'Rugs',
      'Smart contract failures',
      'Malicious transaction signatures',
      'Malware',
      'Address Poisoning',
      'Accidentally revealing my seed phrase',
    ],
    correctAnswers: ['Address Poisoning', 'Malware', 'Malicious transaction signatures'],
    explanation:
      'You are covered for certain loss events under phishing and malware - malicious transaction signatures, address poisoning, and malware, but not all events under phishing and social engineering. You are NOT covered for rugs or if you reveal your seed phrase.',
  },
  {
    id: 'kyc',
    question: 'When do I need to KYC?',
    options: ['When purchasing coverage', 'When creating a claim', 'When connecting my wallet', 'Never'],
    correctAnswers: ['When creating a claim'],
    explanation: 'You only need to complete KYC when creating a claim, not when purchasing coverage.',
  },
  {
    id: 'payout',
    question: 'How much of my coverage amount do I receive in a payout?',
    options: ['100% of coverage amount', '90% of coverage amount', '80% of coverage amount', '75% of coverage amount'],
    correctAnswers: ['90% of coverage amount'],
    explanation:
      'Fairside covers 90% of your loss, with a 10% Personal Responsibility Amount deducted from your payout—not your coverage. This approach encourages accountability, helps maintain a robust community fund, and ensures long-term affordability for all members.',
  },
];

const BlockchainList = ({ title, chains }: { title: string; chains: string[] }) => (
  <div className="flex flex-col gap-2">
    <h4 className="text-lg font-semibold">{title}</h4>
    <div className="grid grid-cols-2 gap-2">
      {chains.map((chain) => (
        <div key={chain} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-brand" />
          {chain}
        </div>
      ))}
    </div>
  </div>
);

interface CoverageItem {
  id: string;
  text: string;
}

const CoverageInfo = () => {
  const t = useTranslations('address.coverage');
  const [quizStarted, setQuizStarted] = useState(false);

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
      'Ethereum',
      'Base',
      'Arbitrum',
      'Optimism',
      'Avalanche',
      'BSC (Binance Smart Chain)',
      'Polygon',
      'Fantom (Sonic)',
    ],
    nonEvm: ['Bitcoin', 'Solana', 'TON (The Open Network)'],
  };

  return (
    <div className="flex flex-col gap-2 w-full max-w-7xl mx-auto">
      <div className={twMerge('transition-all duration-300', quizStarted && 'blur-sm pointer-events-none')}>
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

              <Button style="primary" size="lg" className="self-center mt-4" onClick={() => setQuizStarted(true)}>
                {t('info.quiz.start')}
              </Button>
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

      <CoverageQuiz open={quizStarted} onClose={() => setQuizStarted(false)} />
    </div>
  );
};

export default CoverageInfo;
