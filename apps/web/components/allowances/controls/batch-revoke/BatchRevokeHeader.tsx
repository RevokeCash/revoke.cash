import { useTranslations } from 'next-intl';

interface Props {
  totalRevoked: number;
  totalReverted: number;
  totalSelected: number;
}

const BatchRevokeHeader = ({ totalRevoked, totalReverted, totalSelected }: Props) => {
  const t = useTranslations();

  return (
    <div>
      <h2 className="text-center text-2xl">{t('address.batch_revoke.title')}</h2>
      <div className="text-center mb-4 text-sm text-zinc-500 space-x-1">
        <span>
          {t('address.batch_revoke.revoked')}: {totalRevoked}
        </span>
        <span>|</span>
        <span>
          {t('address.batch_revoke.failed')}: {totalReverted}
        </span>
        <span>|</span>
        <span>
          {t('address.batch_revoke.total')}: {totalSelected}
        </span>
      </div>
    </div>
  );
};

export default BatchRevokeHeader;
