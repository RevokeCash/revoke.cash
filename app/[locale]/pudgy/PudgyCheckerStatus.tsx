import Button from 'components/common/Button';
import Checkbox from 'components/common/Checkbox';
import ky from 'lib/ky';
import analytics from 'lib/utils/analytics';
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

  // TODO: Add some fun images from Pudgy?

  return (
    <div className={'rounded-lg border border-black dark:border-white p-4'}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-full flex items-center gap-4">
          <div className="flex flex-col gap-2 ml-2">
            <h3>{t(`pudgy.result.${adjustedStatus}.title`)}</h3>
            <p className="text-sm">{t.rich(`pudgy.result.${adjustedStatus}.description`)}</p>
          </div>
        </div>
        <PudgyStatusButton
          status={adjustedStatus}
          address={address}
          setCompletedQuiz={setCompletedQuiz}
          setClaimed={setClaimed}
        />
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
        style="secondary"
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
    const response = await ky.post('/api/pudgy/claim', { json: { address } }).json<{ status: string }>();
    analytics.track('Pudgy Claimed', { account: address, status: response.status });
    setClaimed(true);
    return response.status;
  });

  useEffect(() => {
    if (error) {
      const errorMessage = (error as any)?.data?.message;
      toast.error(`${t('pudgy.errors.claim_failed')}: ${errorMessage}`);
    }
  }, [t, error]);

  return (
    <div className="flex flex-col gap-2">
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
        className="self-center my-2"
        onClick={() => execute()}
      >
        {result ? t('pudgy.buttons.already_claimed') : loading ? t('pudgy.buttons.claiming') : t('pudgy.buttons.claim')}
      </Button>
    </div>
  );
};
