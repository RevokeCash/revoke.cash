import InfoPanel from './InfoPanel';
import MarketplacePanel from './marketplace/MarketplacePanel';
import PermitsPanel from './permit/PermitsPanel';

const SignaturesDashboard = () => {
  return (
    <div className="flex flex-col gap-2">
      <InfoPanel />
      <MarketplacePanel />
      <PermitsPanel />
    </div>
  );
};

export default SignaturesDashboard;
