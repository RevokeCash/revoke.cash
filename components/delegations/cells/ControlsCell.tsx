'use client';

import Button from 'components/common/Button';
import type { Delegation } from 'lib/delegate/DelegatePlatform';
import { useRevokeAllDelegations, useRevokeDelegation } from 'lib/hooks/ethereum/useRevokeDelegation';
import { useTranslations } from 'next-intl';

interface Props {
  delegation: Delegation;
  onRevoke: (delegation: Delegation) => void;
}

const ControlsCell = ({ delegation, onRevoke }: Props) => {
  const t = useTranslations();

  // single-delegation hook
  const { revoke } = useRevokeDelegation(delegation, onRevoke);

  // all-delegations hook—wrap your onRevoke so it still gets the delegation
  const { revokeAll } = useRevokeAllDelegations(delegation.platform, delegation.chainId, () => onRevoke(delegation));

  // pick which function to call
  const handleRevoke = delegation.type === 'ALL' ? revokeAll : revoke;

  return (
    <div className="text-right">
      <Button
        style="secondary" // same color scheme as your RevokeButton
        size="sm" // same padding, height, and font-size
        onClick={handleRevoke}
        disabled={!handleRevoke} // disable if no function present
      >
        {t('common.buttons.revoke')}
      </Button>
    </div>
  );
};

export default ControlsCell;
