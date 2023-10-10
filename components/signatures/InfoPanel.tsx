import Button from 'components/common/Button';
import Card from 'components/common/Card';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useMounted } from 'lib/hooks/useMounted';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';

const InfoPanel = () => {
  const { t } = useTranslation();
  const isMounted = useMounted();
  const { signatureNoticeAcknowledged, acknowledgeSignatureNotice } = useAddressPageContext();

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <p>
          <Trans
            i18nKey="address:signatures.info.description"
            components={[<span className="italic" />, <span className="font-bold" />]}
          />
        </p>
        {isMounted && !signatureNoticeAcknowledged && (
          <Button size="md" style="primary" className="shrink-0" onClick={acknowledgeSignatureNotice}>
            {t('common:buttons.understand')}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default InfoPanel;
