'use client';

import { useTranslations } from 'next-intl';

interface Props {
  incoming?: boolean;
  colSpan?: number;
}

/**
 * Component to display when no delegations are found
 * Can be used standalone or within a table structure
 */
const NoDelegationsFound = ({ incoming = false, colSpan }: Props) => {
  const t = useTranslations();

  const content = (
    <>
      <h2 className="text-lg font-semibold">
        {incoming ? t('address.delegations.no_incoming_delegations') : t('address.delegations.no_outgoing_delegations')}
      </h2>
      <p>{incoming ? t('address.delegations.incoming_explanation') : t('address.delegations.outgoing_explanation')}</p>
    </>
  );

  // If colSpan is provided, render as a table row
  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan} className="p-6 text-center">
          {content}
        </td>
      </tr>
    );
  }

  // Otherwise render as standalone div
  return <div className="rounded-md border p-6 text-center">{content}</div>;
};

export default NoDelegationsFound;
