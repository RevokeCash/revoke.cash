'use client';

import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import Quiz from 'components/coverage/Quiz';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface Props {
  setCompletedQuiz: (completed: boolean) => void;
}

const PudgyQuiz = ({ setCompletedQuiz }: Props) => {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const questions = [
    {
      id: 'what_cold_wallet',
      question: 'What is a cold wallet (hardware wallet)?',
      options: [
        'A wallet stored on a decentralized exchange',
        'A crypto wallet that is always connected to the internet',
        'A physical device that stores private keys offline',
        'A backup phrase written on paper',
      ],
      correctAnswers: ['A physical device that stores private keys offline'],
      explanation:
        'A cold wallet is a physical device that stores private keys offline, making it more secure than a hot wallet.',
    },
    {
      id: 'when_cold_wallet',
      question: 'When should you use a cold wallet instead of a hot wallet?',
      options: [
        'When storing high-value NFTs or assets long-term',
        'When you want to minimize exposure to browser-based attacks',
        "When you don't need to actively trade or mint from that wallet",
      ],
      correctAnswers: [
        'When storing high-value NFTs or assets long-term',
        'When you want to minimize exposure to browser-based attacks',
        "When you don't need to actively trade or mint from that wallet",
      ],
      explanation: 'The added security of a cold wallet is most useful in all of these scenarios.',
    },
    {
      id: 'why_cold_wallet',
      question: 'Why is a cold wallet considered more secure than a hot wallet?',
      options: [
        'It automatically converts crypto to fiat',
        'It hides your wallet address from the blockchain',
        'It keeps private keys offline, reducing exposure to malware and phishing',
      ],
      correctAnswers: ['It keeps private keys offline, reducing exposure to malware and phishing'],
      explanation:
        'A cold wallet keeps your private keys offline, making it harder for attackers to access your assets, even if your computer is compromised.',
    },
    {
      id: 'how_cold_wallet_reduces_exposure',
      question: 'How does a cold wallet reduce exposure to malware and phishing?',
      options: [
        'It keeps your private keys offline, making it harder for attackers to access your assets',
        'It prevents malware on your daily device from reaching your crypto',
        'It reduces the chance of signing unintended transactions by adding an extra layer of verification',
      ],
      correctAnswers: [
        'It keeps your private keys offline, making it harder for attackers to access your assets',
        'It prevents malware on your daily device from reaching your crypto',
        'It reduces the chance of signing unintended transactions by adding an extra layer of verification',
      ],
      explanation:
        'A cold wallet keeps your private keys offline, making it harder for attackers to access your assets, even if your computer is compromised.',
    },
    {
      id: 'purpose_of_quiz',
      question: 'What is the purpose of this quiz?',
      options: [
        'To promote the new Ledger',
        'To teach you how to spot scams',
        'To encourage people to take real steps toward better wallet security',
        'To promote cold wallets as fashion accessories',
      ],
      correctAnswers: ['To encourage people to take real steps toward better wallet security'],
      explanation:
        'This quiz is designed to educate users about the benefits of cold wallets and how to use them safely.',
    },
  ];

  return (
    <>
      <Button style="primary" size="md" className="self-center my-2" onClick={() => setOpen(true)}>
        {t('pudgy.quiz.start_quiz')}
      </Button>
      <Modal open={open} setOpen={setOpen} className="w-full sm:max-w-2xl">
        <Quiz
          title={t('pudgy.quiz.title')}
          questions={questions}
          trackQuizAction={() => {}}
          callToAction={t('pudgy.quiz.finish_quiz')}
          completedAction={() => {
            setOpen(false);
            setCompletedQuiz(true);
          }}
        />
      </Modal>
    </>
  );
};

export default PudgyQuiz;
