'use client';

import { FAIRSIDE_APP_URL, useFairsideStore } from 'lib/coverage/fairside';
import { useTranslations } from 'next-intl';
import Quiz from './Quiz';

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
      'Custodial account drains',
      'Malware',
      'Address poisoning',
      'Accidentally revealing my seed phrase',
    ],
    correctAnswers: ['Address poisoning', 'Malware', 'Malicious transaction signatures'],
    explanation:
      'You are covered for certain loss events, such as address poisoning, malware, and malicious transaction signatures, but not for all events under phishing and social engineering. You are NOT covered for rugs, custodial account drains, or if you reveal your seed phrase.',
  },
  {
    id: 'malware-coverage',
    question: 'What is the minimum coverage amount to be covered for malware?',
    options: ['0.25 ETH', '1 ETH', '5 ETH', '10 ETH'],
    correctAnswers: ['10 ETH'],
    explanation:
      'When you submit a claim for malware, you have to send your device to a third party to check that you actually were drained due to malware. This is an expensive process and would drastically hurt the pool for smaller amounts of coverage.',
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
      'Fairside covers 90% of your loss, with a 10% personal responsibility amount deducted from your payout. This approach encourages accountability, helps maintain a robust community fund, and ensures long-term affordability for all members.',
  },
  {
    id: 'wallets',
    question: 'Can I submit a claim for any wallet, or only for wallets I added beforehand?',
    options: [
      'I can cover up to 10 wallets, but they have to be added to my membership before a claim was submitted',
      'I can submit any wallet',
    ],
    correctAnswers: [
      'I can cover up to 10 wallets, but they have to be added to my membership before a claim was submitted',
    ],
    explanation: `Without adding wallets beforehand, it would be possible to claim for a wallet that is not yours or for someone who hasn't purchased coverage.`,
  },
];

const CoverageQuiz = () => {
  const { trackQuizAction } = useFairsideStore();
  const t = useTranslations();

  return (
    <Quiz
      title={t('address.coverage.info.quiz.title')}
      questions={quizQuestions}
      trackQuizAction={trackQuizAction}
      callToAction={t('address.coverage.info.quiz.get_coverage')}
      completedAction={() => {
        setTimeout(() => trackQuizAction('get_coverage_click'), 0);
        window.open(FAIRSIDE_APP_URL, '_blank');
      }}
    />
  );
};

export default CoverageQuiz;
