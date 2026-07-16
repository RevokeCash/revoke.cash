import ExecutorBalancesSection from 'components/admin/overview/ExecutorBalancesSection';
import HealthSection from 'components/admin/overview/HealthSection';
import RevenueOverviewSection from 'components/admin/overview/RevenueOverviewSection';

const AdminOverviewPage = () => (
  <div className="flex flex-col gap-6">
    <RevenueOverviewSection />
    <ExecutorBalancesSection />
    <HealthSection />
  </div>
);

export default AdminOverviewPage;
