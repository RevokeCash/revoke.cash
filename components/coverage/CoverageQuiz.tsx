'use client';

import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import {
  FAIRSIDE_APP_URL,
  trackGetCoverageClick,
  trackQuizComplete,
  trackQuizQuestion1,
  trackQuizQuestion2,
  trackQuizQuestion3,
  trackQuizQuestion4,
  trackQuizQuestion5,
  trackQuizStart,
} from 'lib/coverage/fairside';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
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
  const t = useTranslations('address.coverage');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [canProceed, setCanProceed] = useState(false);

  // Track quiz start when component mounts
  useEffect(() => {
    let isSubscribed = true;

    // Only send if component is still mounted
    if (isSubscribed) {
      const timeoutId = setTimeout(() => {
        trackQuizStart();
      }, 0);

      return () => {
        isSubscribed = false;
        clearTimeout(timeoutId);
      };
    }
  }, []);

  const isAnswerCorrect =
    quizQuestions[currentQuestion].correctAnswers.every((answer) => selectedAnswers.includes(answer)) &&
    selectedAnswers.length === quizQuestions[currentQuestion].correctAnswers.length;

  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return;
    setSelectedAnswers((selectedAnswers) =>
      selectedAnswers.includes(answer) ? selectedAnswers.filter((a) => a !== answer) : [...selectedAnswers, answer],
    );
  };

  const handleCheckAnswers = () => {
    setShowExplanation(true);

    // Track the current question completion
    // Use setTimeout to ensure we don't get duplicate calls
    const action = (() => {
      switch (currentQuestion) {
        case 0:
          return () => trackQuizQuestion1();
        case 1:
          return () => trackQuizQuestion2();
        case 2:
          return () => trackQuizQuestion3();
        case 3:
          return () => trackQuizQuestion4();
        case 4:
          return () => trackQuizQuestion5();
        default:
          return null;
      }
    })();

    if (action) {
      setTimeout(action, 0);
    }

    // If the answer is correct, we can proceed immediately, if not we wait 3 seconds before enabling proceeding
    if (isAnswerCorrect) {
      setCanProceed(true);
    } else {
      setCanProceed(false);
      setTimeout(() => {
        setCanProceed(true);
      }, 3000);
    }

    if (currentQuestion === quizQuestions.length - 1) {
      setQuizCompleted(true);
      setTimeout(() => trackQuizComplete(), 0);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswers([]);
      setShowExplanation(false);
      setCanProceed(false);
    } else if (quizCompleted) {
      setTimeout(() => trackGetCoverageClick(), 0);
      window.open(FAIRSIDE_APP_URL, '_blank');
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('info.quiz.title')}</h2>
        <span className="text-sm text-zinc-600 dark:text-zinc-400 mr-10">
          {t('info.quiz.question_progress', { current: currentQuestion + 1, total: quizQuestions.length })}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold">{quizQuestions[currentQuestion].question}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
            {quizQuestions[currentQuestion].correctAnswers.length > 1
              ? 'Select all that apply'
              : 'Select the correct answer'}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {quizQuestions[currentQuestion].options.map((option) => (
            <QuizOption
              key={option}
              option={option}
              isSelected={selectedAnswers.includes(option)}
              isCorrect={quizQuestions[currentQuestion].correctAnswers.includes(option)}
              showExplanation={showExplanation}
              onSelect={() => handleAnswerSelect(option)}
            />
          ))}
        </div>
      </div>

      {showExplanation && (
        <AnswerExplanation isCorrect={isAnswerCorrect} explanation={quizQuestions[currentQuestion].explanation} />
      )}

      <QuizFooter
        showExplanation={showExplanation}
        handleCheckAnswers={handleCheckAnswers}
        handleNextQuestion={handleNextQuestion}
        selectedAnswers={selectedAnswers}
        currentQuestion={currentQuestion}
        quizCompleted={quizCompleted}
        canProceed={canProceed}
      />
    </div>
  );
};

interface QuizOptionProps {
  option: string;
  isSelected: boolean;
  isCorrect: boolean;
  showExplanation: boolean;
  onSelect: () => void;
}

const QuizOption = ({ option, isSelected, isCorrect, showExplanation, onSelect }: QuizOptionProps) => {
  const classes = twMerge(
    'p-3 border rounded-lg text-left transition-colors flex items-center justify-start gap-3',
    showExplanation && isCorrect && 'border-green-500 bg-green-50 dark:bg-green-900/20',
    showExplanation && !isCorrect && isSelected && 'border-red-500 bg-red-50 dark:bg-red-900/20',
    showExplanation && !isCorrect && !isSelected && 'border-zinc-300 dark:border-zinc-700',
    !showExplanation && isSelected && 'border-brand bg-brand/10',
    !showExplanation && !isSelected && 'border-zinc-300 dark:border-zinc-700 hover:border-brand',
  );

  return (
    <Button style="none" onClick={onSelect} className={classes}>
      <QuizCheckmark isCorrect={isCorrect} isSelected={isSelected} showExplanation={showExplanation} />
      <span
        className={twMerge(
          showExplanation && isCorrect && !isSelected && 'text-green-600 dark:text-green-400 font-medium',
        )}
      >
        {option}
      </span>
    </Button>
  );
};

interface QuizCheckmarkProps {
  isCorrect: boolean;
  isSelected: boolean;
  showExplanation: boolean;
}

const QuizCheckmark = ({ isCorrect, isSelected, showExplanation }: QuizCheckmarkProps) => {
  const classes = twMerge(
    'w-5 h-5 border rounded flex items-center justify-center transition-colors shrink-0',
    showExplanation && isCorrect && 'border-green-500 bg-green-500',
    showExplanation && !isCorrect && isSelected && 'border-red-500 bg-red-500',
    showExplanation && !isCorrect && !isSelected && 'border-zinc-300 dark:border-zinc-700',
    !showExplanation && isSelected && 'border-brand bg-brand',
    !showExplanation && !isSelected && 'border-zinc-300 dark:border-zinc-700',
  );

  return (
    <div className={classes}>
      {(isSelected || (showExplanation && isCorrect)) && (
        <CheckCircleIcon
          className={twMerge(
            'w-4 h-4',
            showExplanation ? (isCorrect ? 'text-white' : isSelected ? 'text-white' : 'text-zinc-400') : 'text-white',
          )}
        />
      )}
    </div>
  );
};

interface AnswerExplanationProps {
  isCorrect: boolean;
  explanation: string;
}

const AnswerExplanation = ({ isCorrect, explanation }: AnswerExplanationProps) => {
  return (
    <div
      className={twMerge('p-4 rounded-lg', isCorrect ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900')}
    >
      <div className="flex items-center gap-2 mb-2">
        {isCorrect ? (
          <>
            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-green-600 dark:text-green-400">Correct! Well done.</p>
          </>
        ) : (
          <>
            <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              Incorrect. Here are the correct answers:
            </p>
          </>
        )}
      </div>
      <p className="text-sm text-zinc-800 dark:text-zinc-200">{explanation}</p>
    </div>
  );
};

interface QuizFooterProps {
  showExplanation: boolean;
  handleCheckAnswers: () => void;
  handleNextQuestion: () => void;
  selectedAnswers: string[];
  currentQuestion: number;
  quizCompleted: boolean;
  canProceed: boolean;
}

const QuizFooter = ({
  showExplanation,
  handleCheckAnswers,
  handleNextQuestion,
  selectedAnswers,
  currentQuestion,
  quizCompleted,
  canProceed,
}: QuizFooterProps) => {
  const t = useTranslations();

  return (
    <div className="flex justify-end gap-4">
      {!showExplanation ? (
        <Button style="primary" size="md" onClick={handleCheckAnswers} disabled={selectedAnswers.length === 0}>
          {quizQuestions[currentQuestion].correctAnswers.length > 1
            ? 'Check Selected Answers'
            : t('address.coverage.info.quiz.check_answer')}
        </Button>
      ) : (
        <>
          <Button
            style="primary"
            size="md"
            onClick={quizCompleted && canProceed ? undefined : handleNextQuestion}
            href={quizCompleted && canProceed ? FAIRSIDE_APP_URL : undefined}
            external={quizCompleted && canProceed}
            disabled={!canProceed}
          >
            {!canProceed
              ? t('address.coverage.info.quiz.wait_and_read')
              : quizCompleted
                ? t('address.coverage.info.quiz.get_coverage')
                : t('address.coverage.info.quiz.next_question')}
          </Button>
        </>
      )}
    </div>
  );
};

export default CoverageQuiz;
