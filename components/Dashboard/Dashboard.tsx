import DashboardBody from './DashboardBody';
import ConnectSection from './header/ConnectSection';
import DashboardHeader from './header/DashboardHeader';

function Dashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <ConnectSection />
      <div className="Dashboard">
        <DashboardHeader />
        <DashboardBody />
      </div>
    </div>
  );
}

export default Dashboard;
