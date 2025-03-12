'use client';

import { CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

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
      'Custodial Account Drains',
      'Malware',
      'Address Poisoning',
      'Accidentally revealing my seed phrase',
    ],
    correctAnswers: ['Address Poisoning', 'Malware', 'Malicious transaction signatures'],
    explanation:
      'You are covered for certain loss events under phishing and malware - malicious transaction signatures, address poisoning, and malware, but not all events under phishing and social engineering. You are NOT covered for rugs or if you reveal your seed phrase.',
  },
  {
    id: 'malware-coverage',
    question: 'What is the minimum coverage amount to be covered for malware?',
    options: ['0.25 ETH', '1 ETH', '5 ETH', '10 ETH'],
    correctAnswers: ['10 ETH'],
    explanation:
      'When you submit a claim for malware, you have to send in your device to a third party to check that you actually were drained due to malware. This is an expensive process and would drastically hurt the pool for smaller amounts of coverage.',
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
  {
    id: 'wallets',
    question: 'Can I claim any wallet at the time of submitting a claim, or did they already have to be added?',
    options: [
      'You can cover up to 10 wallets, but they have to be added to your membership before a claim was submitted!',
      'I can submit any wallet',
    ],
    correctAnswers: [
      'You can cover up to 10 wallets, but they have to be added to your membership before a claim was submitted!',
    ],
    explanation: `Without adding wallets beforehand, you can defraud us by submitting a wallet that is not yours, or for someone who hasn't purchased coveraged`,
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

const CoverageQuiz = ({ open, onClose }: Props) => {
  const t = useTranslations('address.coverage');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [canProceed, setCanProceed] = useState(false);

  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return;
    const newAnswers = selectedAnswers.includes(answer)
      ? selectedAnswers.filter((a) => a !== answer)
      : [...selectedAnswers, answer];
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    const isCorrect =
      quizQuestions[currentQuestion].correctAnswers.every((answer) => selectedAnswers.includes(answer)) &&
      selectedAnswers.length === quizQuestions[currentQuestion].correctAnswers.length;

    setShowExplanation(true);

    // Only add delay if answer is incorrect
    if (isCorrect) {
      setCanProceed(true);
    } else {
      setCanProceed(false);
      // Enable proceeding after 2 seconds only for incorrect answers
      setTimeout(() => {
        setCanProceed(true);
      }, 3000);
    }

    if (currentQuestion === quizQuestions.length - 1) {
      setQuizCompleted(true);
    }
  };

  const handleNextStep = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswers([]);
      setShowExplanation(false);
      setCanProceed(false);
    } else if (quizCompleted) {
      window.open('https://app.fairside.io/', '_blank');
    }
  };

  const isAnswerCorrect =
    quizQuestions[currentQuestion].correctAnswers.every((answer) => selectedAnswers.includes(answer)) &&
    selectedAnswers.length === quizQuestions[currentQuestion].correctAnswers.length;

  return (
    <div className="w-full max-w-2xl flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('info.quiz.title')}</h2>
        <span className="text-sm text-gray-600 dark:text-gray-400 mr-10">
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
          {quizQuestions[currentQuestion].options.map((option) => {
            const isSelected = selectedAnswers.includes(option);
            const isCorrect = quizQuestions[currentQuestion].correctAnswers.includes(option);
            const showCorrectness = showExplanation;

            return (
              <button
                type="button"
                key={option}
                onClick={() => handleAnswerSelect(option)}
                className={twMerge(
                  'p-3 border rounded-lg text-left transition-colors flex items-center gap-3',
                  showCorrectness
                    ? isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : isSelected
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-700'
                    : isSelected
                      ? 'border-brand bg-brand/10'
                      : 'border-gray-300 dark:border-gray-700 hover:border-brand',
                )}
                disabled={showExplanation}
              >
                <div
                  className={twMerge(
                    'w-5 h-5 border rounded flex items-center justify-center transition-colors',
                    showCorrectness
                      ? isCorrect
                        ? 'border-green-500 bg-green-500'
                        : isSelected
                          ? 'border-red-500 bg-red-500'
                          : 'border-gray-300 dark:border-gray-700'
                      : isSelected
                        ? 'border-brand bg-brand'
                        : 'border-gray-300 dark:border-gray-700',
                  )}
                >
                  {(isSelected || (showCorrectness && isCorrect)) && (
                    <CheckCircleIcon
                      className={twMerge(
                        'w-4 h-4',
                        showCorrectness
                          ? isCorrect
                            ? 'text-white'
                            : isSelected
                              ? 'text-white'
                              : 'text-gray-400'
                          : 'text-white',
                      )}
                    />
                  )}
                </div>
                <span
                  className={twMerge(
                    showCorrectness && isCorrect && !isSelected && 'text-green-600 dark:text-green-400 font-medium',
                  )}
                >
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {showExplanation && (
        <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
          <div className="flex items-start gap-2 mb-2">
            <p className="text-sm font-medium">
              {isAnswerCorrect ? 'Correct! Well done.' : 'Here are the correct answers:'}
            </p>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-200">{quizQuestions[currentQuestion].explanation}</p>
        </div>
      )}

      <div className="flex justify-end gap-4">
        {!showExplanation ? (
          <Button style="primary" size="md" onClick={handleNextQuestion} disabled={selectedAnswers.length === 0}>
            {quizQuestions[currentQuestion].correctAnswers.length > 1
              ? 'Check Selected Answers'
              : t('info.quiz.check_answer')}
          </Button>
        ) : (
          <>
            {currentQuestion === quizQuestions.length - 1 && (
              <Button
                style="purple"
                size="md"
                onClick={() => window.open('https://app.fairside.io/retroactive', '_blank')}
              >
                {t('info.quiz.retroactive_campaign')}
              </Button>
            )}
            <Button
              style="primary"
              size="md"
              onClick={handleNextStep}
              disabled={!canProceed}
              className={!canProceed ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {!canProceed
                ? 'Please wait and read!'
                : quizCompleted
                  ? t('info.quiz.get_coverage')
                  : t('info.quiz.next_question')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CoverageQuiz;
