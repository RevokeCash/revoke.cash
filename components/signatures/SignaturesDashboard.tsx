import NftMarketplacePanel from './NftMarketplacePanel';
import PermitsPanel from './PermitsPanel';

const SignaturesDashboard = () => {
  return (
    <div className="flex flex-col gap-2">
      <NftMarketplacePanel />
      <PermitsPanel />
    </div>
  );
};

export default SignaturesDashboard;
