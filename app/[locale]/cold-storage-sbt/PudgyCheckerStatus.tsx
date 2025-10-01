import Button from 'components/common/Button';
import Checkbox from 'components/common/Checkbox';
import ky from 'lib/ky';
import { apiLogin } from 'lib/utils';
import analytics from 'lib/utils/analytics';
import { parseErrorMessage } from 'lib/utils/errors';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { toast } from 'react-toastify';
import PudgyQuiz from './PudgyQuiz';
import PudgyShareButton from './PudgyShareButton';

interface Props {
  address: string;
  status: PudgyCheckerStatusString;
}

export type PudgyCheckerStatusString =
  | 'eligible'
  | 'has_allowances'
  | 'no_tokens'
  | 'already_claimed'
  | 'quiz_success'
  | 'confirmed';

const PudgyCheckerStatus = ({ address, status }: Props) => {
  const t = useTranslations();

  const [completedQuiz, setCompletedQuiz] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const adjustedStatus = claimed ? 'confirmed' : status === 'eligible' && completedQuiz ? 'quiz_success' : status;

  const images = {
    eligible: '/assets/images/cold-storage-sbt/chest-bump-pudgy.gif',
    has_allowances: '/assets/images/cold-storage-sbt/study-pudgy.gif',
    no_tokens: '/assets/images/cold-storage-sbt/study-pudgy.gif',
    already_claimed: '/assets/images/cold-storage-sbt/chest-bump-pudgy.gif',
    quiz_success: '/assets/images/cold-storage-sbt/accomplished-pudgy.png',
    confirmed: '/assets/images/cold-storage-sbt/happy-pudgy.gif',
  } as const;

  return (
    <div className={'rounded-lg border border-black dark:border-white p-4'}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-full flex items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-center w-full">
            <Image
              src={images[adjustedStatus]}
              alt="Pudgy Penguins x Revoke.cash"
              className="w-80 h-80"
              width={1000}
              height={1000}
            />
            <div className="flex flex-col gap-2 ml-2 w-full items-start">
              <h3>{t(`pudgy.result.${adjustedStatus}.title`)}</h3>
              <div className="text-sm mb-4 leading-normal text-zinc-700 dark:text-zinc-300">
                {t.rich(`pudgy.result.${adjustedStatus}.description`)}
              </div>
              <PudgyStatusButton
                status={adjustedStatus}
                address={address}
                setCompletedQuiz={setCompletedQuiz}
                setClaimed={setClaimed}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PudgyCheckerStatus;

interface PudgyStatusButtonProps {
  status: PudgyCheckerStatusString;
  address: string;
  setCompletedQuiz: (completed: boolean) => void;
  setClaimed: (claimed: boolean) => void;
}

const PudgyStatusButton = ({ status, address, setCompletedQuiz, setClaimed }: PudgyStatusButtonProps) => {
  const t = useTranslations();

  if (status === 'eligible') {
    return <PudgyQuiz setCompletedQuiz={setCompletedQuiz} />;
  }

  if (status === 'quiz_success') {
    return <ClaimButton address={address} setClaimed={setClaimed} />;
  }

  if (status === 'confirmed' || status === 'already_claimed') {
    // return social share button
    return <PudgyShareButton />;
  }

  if (status === 'has_allowances') {
    return (
      <Button
        href={`/address/${address}?chainId=1`}
        className="shrink-0 w-full sm:w-fit"
        size="md"
        style="primary"
        router
      >
        {t('pudgy.result.has_allowances.button')}
      </Button>
    );
  }

  return null;
};

const ClaimButton = ({ address, setClaimed }: { address: string; setClaimed: (claimed: boolean) => void }) => {
  const t = useTranslations();

  const [hasChecked1, setHasChecked1] = useState(false);
  const [hasChecked2, setHasChecked2] = useState(false);

  const hasChecked = hasChecked1 && hasChecked2;

  const { result, execute, loading, error } = useAsyncCallback(async () => {
    await apiLogin();
    const response = await ky.post('/api/pudgy/claim', { json: { address } }).json<{ status: string }>();
    analytics.track('Pudgy Claimed', { account: address, status: response.status });
    setClaimed(true);
    return response.status;
  });

  useEffect(() => {
    if (error) {
      const errorMessage = parseErrorMessage(error);
      toast.error(`${t('pudgy.errors.claim_failed')}: ${errorMessage}`);
    }
  }, [t, error]);

  return (
    <div className="flex items-start flex-col gap-2">
      <div className="flex items-center gap-2">
        <Checkbox checked={hasChecked1} onChange={() => setHasChecked1(!hasChecked1)} className="shrink-0" />
        <span className="text-sm">{t('pudgy.buttons.checkbox_1')}</span>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox checked={hasChecked2} onChange={() => setHasChecked2(!hasChecked2)} className="shrink-0" />
        <span className="text-sm">{t('pudgy.buttons.checkbox_2')}</span>
      </div>
      <Button
        disabled={!hasChecked || Boolean(result) || loading}
        loading={loading}
        style="primary"
        size="md"
        className="my-2"
        onClick={() => execute()}
      >
        {result ? t('pudgy.buttons.already_claimed') : loading ? t('pudgy.buttons.claiming') : t('pudgy.buttons.claim')}
      </Button>
    </div>
  );
};
