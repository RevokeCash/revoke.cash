import BatchRevokeSplitSection from 'components/admin/revenue/BatchRevokeSplitSection';
import MonthlyRevenueChart from 'components/admin/revenue/MonthlyRevenueChart';
import PaymentFunnelSection from 'components/admin/revenue/PaymentFunnelSection';
import RevenueBreakdownSection from 'components/admin/revenue/RevenueBreakdownSection';
import VatSection from 'components/admin/revenue/VatSection';

const AdminRevenuePage = () => (
  <div className="flex flex-col gap-6">
    <MonthlyRevenueChart />
    <RevenueBreakdownSection />
    <PaymentFunnelSection />
    <BatchRevokeSplitSection />
    <VatSection />
  </div>
);

export default AdminRevenuePage;
