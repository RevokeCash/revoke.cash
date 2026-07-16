import DeferredActionsSection from 'components/admin/executor/DeferredActionsSection';
import ExecutorPipelinesSection from 'components/admin/executor/ExecutorPipelinesSection';
import ExecutorSpendSection from 'components/admin/executor/ExecutorSpendSection';
import StuckSubmittedSection from 'components/admin/executor/StuckSubmittedSection';

const AdminExecutorPage = () => (
  <div className="flex flex-col gap-6">
    <ExecutorPipelinesSection />
    <StuckSubmittedSection />
    <DeferredActionsSection />
    <ExecutorSpendSection />
  </div>
);

export default AdminExecutorPage;
