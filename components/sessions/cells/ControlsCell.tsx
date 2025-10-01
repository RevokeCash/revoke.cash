import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import RevokeButton from 'components/allowances/controls/RevokeButton';
import { useRevokeSession } from 'lib/hooks/ethereum/sessions/useRevokeSession';
import { getSessionKey, type OnSessionRevoke, type Session } from 'lib/utils/sessions';

interface Props {
  session: Session;
  onRevoke: OnSessionRevoke;
}

const ControlsCell = ({ session, onRevoke }: Props) => {
  const { revoke } = useRevokeSession(session, onRevoke);

  return (
    <div className="flex justify-end w-28 mr-0 mx-auto">
      <ControlsWrapper chainId={session.chainId} address={session.account} switchChainSize="sm">
        {(disabled) => (
          <div className="controls-section">
            <RevokeButton transactionKey={getSessionKey(session)} revoke={revoke} disabled={disabled} />
          </div>
        )}
      </ControlsWrapper>
    </div>
  );
};

export default ControlsCell;
