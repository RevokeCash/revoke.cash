'use client';

import { Dialog } from '@headlessui/react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import Card from 'components/common/Card';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

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

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = selectedAnswers.includes(answer)
      ? selectedAnswers.filter((a) => a !== answer)
      : [...selectedAnswers, answer];
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    const isCorrect =
      quizQuestions[currentQuestion].correctAnswers.every((answer) => selectedAnswers.includes(answer)) &&
      selectedAnswers.length === quizQuestions[currentQuestion].correctAnswers.length;
    console.log(quizQuestions[currentQuestion].correctAnswers, selectedAnswers);
    setShowExplanation(true);

    if (isCorrect && currentQuestion === quizQuestions.length - 1) {
      setQuizCompleted(true);
    }
  };

  const handleNextStep = () => {
    const isCorrect =
      quizQuestions[currentQuestion].correctAnswers.every((answer) => selectedAnswers.includes(answer)) &&
      selectedAnswers.length === quizQuestions[currentQuestion].correctAnswers.length;

    if (!isCorrect) {
      return; // Don't proceed if answers are incorrect
    }

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswers([]);
      setShowExplanation(false);
    } else if (quizCompleted) {
      window.open('https://test.fairside.dev/', '_blank');
    }
  };

  const isAnswerCorrect =
    quizQuestions[currentQuestion].correctAnswers.every((answer) => selectedAnswers.includes(answer)) &&
    selectedAnswers.length === quizQuestions[currentQuestion].correctAnswers.length;

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
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div className={twMerge('transition-all duration-300', quizStarted && 'blur-sm pointer-events-none')}>
        <div className="flex flex-col lg:flex-row gap-8">
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

      <Dialog open={quizStarted} onClose={() => setQuizStarted(false)} className="fixed inset-0 z-10 overflow-y-scroll">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white dark:bg-black p-6 border border-black dark:border-white shadow-xl transition-all">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{t('info.quiz.title')}</h2>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('info.quiz.question_progress', { current: currentQuestion + 1, total: quizQuestions.length })}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{quizQuestions[currentQuestion].question}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    {quizQuestions[currentQuestion].correctAnswers.length > 1
                      ? 'Select all that apply'
                      : 'Select the correct answer'}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {quizQuestions[currentQuestion].options.map((option) => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => handleAnswerSelect(option)}
                      className={twMerge(
                        'p-3 border rounded-lg text-left transition-colors flex items-center gap-3',
                        selectedAnswers.includes(option)
                          ? 'border-brand bg-brand/10'
                          : 'border-gray-300 dark:border-gray-700 hover:border-brand',
                      )}
                      disabled={showExplanation}
                    >
                      <div
                        className={twMerge(
                          'w-5 h-5 border rounded flex items-center justify-center transition-colors',
                          selectedAnswers.includes(option)
                            ? 'border-brand bg-brand'
                            : 'border-gray-300 dark:border-gray-700',
                        )}
                      >
                        {selectedAnswers.includes(option) && <CheckCircleIcon className="w-4 h-4 text-white" />}
                      </div>
                      <span>{option}</span>
                    </button>
                  ))}
                </div>
              </div>

              {showExplanation && (
                <div
                  className={twMerge(
                    'p-4 rounded-lg',
                    isAnswerCorrect ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900',
                  )}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {isAnswerCorrect ? (
                      <>
                        <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Correct! Well done.</p>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">
                          Incorrect. Please try again with the correct answers.
                        </p>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {quizQuestions[currentQuestion].explanation}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-4">
                {!showExplanation ? (
                  <Button
                    style="primary"
                    size="md"
                    onClick={handleNextQuestion}
                    disabled={selectedAnswers.length === 0}
                  >
                    {quizQuestions[currentQuestion].correctAnswers.length > 1
                      ? 'Check Selected Answers'
                      : t('info.quiz.check_answer')}
                  </Button>
                ) : (
                  <>
                    {!isAnswerCorrect && (
                      <Button style="secondary" size="md" onClick={() => setShowExplanation(false)}>
                        Try Again
                      </Button>
                    )}
                    {isAnswerCorrect && (
                      <Button style="primary" size="md" onClick={handleNextStep}>
                        {quizCompleted ? t('info.quiz.get_coverage') : t('info.quiz.next_question')}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default CoverageInfo;
