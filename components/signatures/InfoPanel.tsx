import Button from 'components/common/Button';
import Card from 'components/common/Card';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useMounted } from 'lib/hooks/useMounted';
import { useTranslations } from 'next-intl';

const InfoPanel = () => {
  const t = useTranslations();
  const isMounted = useMounted();
  const { signatureNoticeAcknowledged, acknowledgeSignatureNotice } = useAddressPageContext();

  return (
    <Card title={t('address.signatures.info.title')}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <p>{t.rich('address.signatures.info.description')}</p>
        {isMounted && !signatureNoticeAcknowledged && (
          <Button size="md" style="primary" className="shrink-0" onClick={acknowledgeSignatureNotice}>
            {t('common.buttons.understand')}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default InfoPanel;
