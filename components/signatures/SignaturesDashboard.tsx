import MarketplacePanel from './marketplace/MarketplacePanel';
import PermitsPanel from './permit/PermitsPanel';

const SignaturesDashboard = () => {
  return (
    <div className="flex flex-col gap-2">
      <MarketplacePanel />
      <PermitsPanel />
    </div>
  );
};

export default SignaturesDashboard;
