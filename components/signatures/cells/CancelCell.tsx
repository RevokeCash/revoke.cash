import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import Button from 'components/common/Button';
import { useMounted } from 'lib/hooks/useMounted';
import type { TimeLog, TransactionSubmitted } from 'lib/interfaces';
import { waitForSubmittedTransactionConfirmation } from 'lib/utils';
import { HOUR, SECOND } from 'lib/utils/time';
import { useTranslations } from 'next-intl';
import { useAsyncCallback } from 'react-async-hook';

interface Props {
  chainId: number;
  address: string;
  lastCancelled?: TimeLog;
  cancel: () => Promise<TransactionSubmitted>;
}

const CancelCell = ({ chainId, address, lastCancelled, cancel }: Props) => {
  const isMounted = useMounted();
  const t = useTranslations();
  const { execute, loading } = useAsyncCallback(() => waitForSubmittedTransactionConfirmation(cancel()));

  const recentlyCancelled = lastCancelled?.timestamp * SECOND > Date.now() - 24 * HOUR;

  return (
    <div className="flex justify-end w-28 mr-0 mx-auto">
      <ControlsWrapper
        chainId={chainId}
        address={address}
        switchChainSize="sm"
        overrideDisabled={recentlyCancelled}
        disabledReason={t('address.tooltips.recently_cancelled')}
      >
        {(disabled) => (
          <div>
            <Button loading={loading} disabled={isMounted && disabled} size="sm" style="secondary" onClick={execute}>
              {loading ? t('common.buttons.cancelling') : t('common.buttons.cancel_signatures')}
            </Button>
          </div>
        )}
      </ControlsWrapper>
    </div>
  );
};

export default CancelCell;
