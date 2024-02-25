import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import Button from 'components/common/Button';
import { useMounted } from 'lib/hooks/useMounted';
import { TimeLog } from 'lib/interfaces';
import { HOUR, SECOND } from 'lib/utils/time';
import useTranslation from 'next-translate/useTranslation';
import { useAsyncCallback } from 'react-async-hook';

interface Props {
  chainId: number;
  address: string;
  lastCancelled?: TimeLog;
  cancel: () => Promise<void>;
}

const CancelCell = ({ chainId, address, lastCancelled, cancel }: Props) => {
  const isMounted = useMounted();
  const { t } = useTranslation();
  const { execute, loading } = useAsyncCallback(cancel);

  const recentlyCancelled = lastCancelled?.timestamp * SECOND > Date.now() - 24 * HOUR;

  return (
    <div className="flex justify-end w-28 mr-0 mx-auto">
      <ControlsWrapper
        chainId={chainId}
        address={address}
        switchChainSize="sm"
        overrideDisabled={recentlyCancelled}
        disabledReason={t('address:tooltips.recently_cancelled')}
      >
        {(disabled) => (
          <div>
            <Button loading={loading} disabled={isMounted && disabled} size="sm" style="secondary" onClick={execute}>
              {loading ? t('common:buttons.cancelling') : t('common:buttons.cancel_signatures')}
            </Button>
          </div>
        )}
      </ControlsWrapper>
    </div>
  );
};

export default CancelCell;
