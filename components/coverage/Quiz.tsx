'use client';

import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import { useMounted } from 'lib/hooks/useMounted';
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

interface Props {
  title: string;
  questions: QuizQuestion[];
  trackQuizAction: (action: string) => void;
  callToAction: string;
  completedAction: () => void;
}

const Quiz = ({ title, questions, trackQuizAction, callToAction, completedAction }: Props) => {
  const t = useTranslations();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const isMounted = useMounted();

  // Track quiz start when component mounts
  useEffect(() => {
    // Only send if component is still mounted
    if (isMounted) {
      const timeoutId = setTimeout(() => {
        trackQuizAction('quiz_start');
      }, 0);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [isMounted, trackQuizAction]);

  const isAnswerCorrect =
    questions[currentQuestion].correctAnswers.every((answer) => selectedAnswers.includes(answer)) &&
    selectedAnswers.length === questions[currentQuestion].correctAnswers.length;

  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return;
    if (questions[currentQuestion].correctAnswers.length > 1) {
      setSelectedAnswers((selectedAnswers) =>
        selectedAnswers.includes(answer) ? selectedAnswers.filter((a) => a !== answer) : [...selectedAnswers, answer],
      );
    } else {
      setSelectedAnswers([answer]);
    }
  };

  const handleCheckAnswers = () => {
    setShowExplanation(true);

    // Track the current question completion
    // Use setTimeout to ensure we don't get duplicate calls
    setTimeout(() => trackQuizAction(`quiz_${currentQuestion + 1}_question`), 0);

    // If the answer is correct, we can proceed immediately, if not we wait 3 seconds before enabling proceeding
    if (isAnswerCorrect) {
      setCanProceed(true);
    } else {
      setCanProceed(false);
      setTimeout(() => {
        setCanProceed(true);
      }, 3000);
    }

    if (currentQuestion === questions.length - 1) {
      setQuizCompleted(true);
      setTimeout(() => trackQuizAction('quiz_complete'), 0);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswers([]);
      setShowExplanation(false);
      setCanProceed(false);
    } else if (quizCompleted) {
      setTimeout(() => trackQuizAction('call_to_action_click'), 0);
      completedAction();
    }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        <span className="text-sm text-zinc-600 dark:text-zinc-400 mr-10">
          {t('common.quiz.question_progress', { current: currentQuestion + 1, total: questions.length })}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold">{questions[currentQuestion].question}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
            {questions[currentQuestion].correctAnswers.length > 1
              ? t('common.quiz.select_all_that_apply')
              : t('common.quiz.select_correct_answer')}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {questions[currentQuestion].options.map((option) => (
            <QuizOption
              key={option}
              option={option}
              isSelected={selectedAnswers.includes(option)}
              isCorrect={questions[currentQuestion].correctAnswers.includes(option)}
              showExplanation={showExplanation}
              onSelect={() => handleAnswerSelect(option)}
            />
          ))}
        </div>
      </div>

      {showExplanation && (
        <AnswerExplanation isCorrect={isAnswerCorrect} explanation={questions[currentQuestion].explanation} />
      )}

      <QuizFooter
        questions={questions}
        showExplanation={showExplanation}
        handleCheckAnswers={handleCheckAnswers}
        handleNextQuestion={handleNextQuestion}
        selectedAnswers={selectedAnswers}
        currentQuestion={currentQuestion}
        quizCompleted={quizCompleted}
        canProceed={canProceed}
        callToAction={callToAction}
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
  const t = useTranslations();

  return (
    <div
      className={twMerge('p-4 rounded-lg', isCorrect ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900')}
    >
      <div className="flex items-center gap-2 mb-2">
        {isCorrect ? (
          <>
            <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-green-600 dark:text-green-400">{t('common.quiz.correct_answer')}</p>
          </>
        ) : (
          <>
            <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{t('common.quiz.incorrect_answer')}</p>
          </>
        )}
      </div>
      <p className="text-sm text-zinc-800 dark:text-zinc-200">{explanation}</p>
    </div>
  );
};

interface QuizFooterProps {
  questions: QuizQuestion[];
  showExplanation: boolean;
  handleCheckAnswers: () => void;
  handleNextQuestion: () => void;
  selectedAnswers: string[];
  currentQuestion: number;
  quizCompleted: boolean;
  canProceed: boolean;
  callToAction: string;
}

const QuizFooter = ({
  questions,
  showExplanation,
  handleCheckAnswers,
  handleNextQuestion,
  selectedAnswers,
  currentQuestion,
  quizCompleted,
  canProceed,
  callToAction,
}: QuizFooterProps) => {
  const t = useTranslations();

  return (
    <div className="flex justify-end gap-4">
      {!showExplanation ? (
        <Button style="primary" size="md" onClick={handleCheckAnswers} disabled={selectedAnswers.length === 0}>
          {questions[currentQuestion].correctAnswers.length > 1
            ? t('common.quiz.check_selected_answers')
            : t('common.quiz.check_answer')}
        </Button>
      ) : (
        <>
          <Button style="primary" size="md" onClick={handleNextQuestion} disabled={!canProceed}>
            {!canProceed
              ? t('common.quiz.wait_and_read')
              : quizCompleted
                ? callToAction
                : t('common.quiz.next_question')}
          </Button>
        </>
      )}
    </div>
  );
};

export default Quiz;
