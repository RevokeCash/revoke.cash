import DeferredActionsSection from 'components/admin/executor/DeferredActionsSection';
import ExecutorPipelinesSection from 'components/admin/executor/ExecutorPipelinesSection';
import NotUpgradedWalletsSection from 'components/admin/executor/NotUpgradedWalletsSection';
import StuckSubmittedSection from 'components/admin/executor/StuckSubmittedSection';

const AdminExecutorPage = () => (
  <div className="flex flex-col gap-6">
    <ExecutorPipelinesSection />
    <StuckSubmittedSection />
    <DeferredActionsSection />
    <NotUpgradedWalletsSection />
  </div>
);

export default AdminExecutorPage;
