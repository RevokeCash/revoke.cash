import Button from 'components/common/Button';
import Checkbox from 'components/common/Checkbox';
import ky from 'lib/ky';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { toast } from 'react-toastify';
import PudgyQuiz from './PudgyQuiz';

interface Props {
  address: string;
  status: PudgyCheckerStatusString;
}

export type PudgyCheckerStatusString = 'eligible' | 'has_allowances' | 'no_tokens' | 'already_claimed';

const PudgyCheckerStatus = ({ address, status }: Props) => {
  const t = useTranslations();

  const [completedQuiz, setCompletedQuiz] = useState(true);

  // TODO: Add some fun images from Pudgy?

  return (
    <div className={'rounded-lg border border-black dark:border-white p-4'}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-full flex items-center gap-4">
          <div className="flex flex-col gap-2 ml-2">
            <h3>{t(`pudgy.result.${status}.title`)}</h3>
            <p className="text-sm">{t.rich(`pudgy.result.${status}.description`)}</p>
          </div>
        </div>
        <PudgyStatusButton
          status={status}
          address={address}
          completedQuiz={completedQuiz}
          setCompletedQuiz={setCompletedQuiz}
        />
      </div>
    </div>
  );
};

export default PudgyCheckerStatus;

interface PudgyStatusButtonProps {
  status: PudgyCheckerStatusString;
  address: string;
  completedQuiz: boolean;
  setCompletedQuiz: (completed: boolean) => void;
}

const PudgyStatusButton = ({ status, address, completedQuiz, setCompletedQuiz }: PudgyStatusButtonProps) => {
  const t = useTranslations();

  if (status === 'eligible') {
    if (completedQuiz) {
      return <ClaimButton address={address} />;
    }

    return <PudgyQuiz completedQuiz={completedQuiz} setCompletedQuiz={setCompletedQuiz} />;
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

const ClaimButton = ({ address }: { address: string }) => {
  const t = useTranslations();

  const [hasChecked1, setHasChecked1] = useState(false);
  const [hasChecked2, setHasChecked2] = useState(false);

  const hasChecked = hasChecked1 && hasChecked2;

  const { result, execute, loading, error } = useAsyncCallback(async () => {
    const response = await ky.post('/api/pudgy', { json: { address } }).json<{ status: string }>();
    return response.status;
  });

  useEffect(() => {
    if (error) {
      toast.error(`${t('pudgy.errors.claim_failed')}: ${error.message}`);
    }
  }, [t, error]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Checkbox checked={hasChecked1} onChange={() => setHasChecked1(!hasChecked1)} className="shrink-0" />
        <span className="text-sm">I understand the importance of securing crypto with a hardware device</span>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox checked={hasChecked2} onChange={() => setHasChecked2(!hasChecked2)} className="shrink-0" />
        <span className="text-sm">
          I understand that using hot wallets on a laptop or phone leaves you vulnerable to malware.
        </span>
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
