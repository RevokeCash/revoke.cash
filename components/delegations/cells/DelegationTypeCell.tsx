'use client';

import type { Delegation } from 'lib/delegate/DelegatePlatform';
import { useTranslations } from 'next-intl';

interface Props {
  delegation: Delegation;
}

const DelegationTypeCell = ({ delegation }: Props) => {
  const t = useTranslations();

  let typeLabel = '';

  switch (delegation.type) {
    case 'ALL':
      typeLabel = t('address.delegations.types.all');
      break;
    case 'CONTRACT':
      typeLabel = t('address.delegations.types.contract');
      break;
    case 'TOKEN':
      typeLabel = t('address.delegations.types.token');
      break;
    default:
      typeLabel = delegation.type;
  }

  return (
    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
      <div className="flex items-center gap-2">
        <span>{typeLabel}</span>
      </div>
    </td>
  );
};

export default DelegationTypeCell;
