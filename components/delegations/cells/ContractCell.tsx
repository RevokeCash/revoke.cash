'use client';

import AddressDisplay from 'components/address/AddressDisplay';
import type { Delegation } from 'lib/delegate/DelegatePlatform';
import { useTranslations } from 'next-intl';

interface Props {
  delegation: Delegation;
}

const ContractCell = ({ delegation }: Props) => {
  const t = useTranslations();

  if (!delegation.contract) {
    return (
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
        <span className="text-gray-500 dark:text-gray-400">{t('address.delegations.contract.not_applicable')}</span>
      </td>
    );
  }

  return (
    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
      <AddressDisplay address={delegation.contract} />
      {delegation.tokenId && (
        <span className="ml-2 text-gray-500 dark:text-gray-400">ID: {delegation.tokenId.toString()}</span>
      )}
    </td>
  );
};

export default ContractCell;
