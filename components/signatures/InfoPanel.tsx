import Button from 'components/common/Button';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useMounted } from 'lib/hooks/useMounted';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import DashboardPanel from './DashboardPanel';

const InfoPanel = () => {
  const { t } = useTranslation();
  const isMounted = useMounted();
  const { signatureNoticeAcknowledged, acknowledgeSignatureNotice } = useAddressPageContext();

  return (
    <DashboardPanel>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div>
          <Trans
            i18nKey="address:signatures.info.description"
            components={[<span className="italic" />, <span className="font-bold" />]}
          />
        </div>
        {isMounted && !signatureNoticeAcknowledged && (
          <Button size="md" style="primary" className="shrink-0" onClick={acknowledgeSignatureNotice}>
            {t('common:buttons.understand')}
          </Button>
        )}
      </div>
    </DashboardPanel>
  );
};

export default InfoPanel;
