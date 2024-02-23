import DisabledOverlay from 'components/common/DisabledOverlay';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useMounted } from 'lib/hooks/useMounted';
import useTranslation from 'next-translate/useTranslation';
import InfoPanel from './InfoPanel';
import MarketplaceTable from './marketplace/MarketplaceTable';
import PermitsTable from './permit/PermitsTable';

const SignaturesDashboard = () => {
  const { t } = useTranslation();
  const isMounted = useMounted();
  const { signatureNoticeAcknowledged } = useAddressPageContext();

  return (
    <div className="flex flex-col gap-2">
      <InfoPanel />
      {isMounted && !signatureNoticeAcknowledged ? (
        <DisabledOverlay tooltip={t('address:tooltips.acknowledge_signature_notice')}>
          <div className="flex flex-col gap-2">
            <MarketplaceTable />
            <PermitsTable />
          </div>
        </DisabledOverlay>
      ) : (
        <>
          <MarketplaceTable />
          <PermitsTable />
        </>
      )}
    </div>
  );
};

export default SignaturesDashboard;
