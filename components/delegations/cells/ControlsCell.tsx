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

  return (
    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
      <Button size="xs" onClick={revoke} disabled={!revoke}>
        {t('address.delegations.actions.revoke')}
      </Button>
    </td>
  );
};

export default ControlsCell;
