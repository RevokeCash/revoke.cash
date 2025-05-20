'use client';

import Button from 'components/common/Button';
import type { Delegation } from 'lib/delegate/DelegatePlatform';
import { useRevokeDelegation } from 'lib/hooks/ethereum/useRevokeDelegation';
import { useTranslations } from 'next-intl';

interface Props {
  delegation: Delegation;
  onRevoke: (delegation: Delegation) => void;
}

const ControlsCell = ({ delegation, onRevoke }: Props) => {
  const t = useTranslations();

  const { revoke } = useRevokeDelegation(delegation, onRevoke);

  const handleRevoke = revoke;

  return (
    <div className="text-right">
      <Button style="secondary" size="sm" onClick={handleRevoke} disabled={!handleRevoke}>
        {t('common.buttons.revoke')}
      </Button>
    </div>
  );
};

export default ControlsCell;
