import StatusLabel from 'components/common/StatusLabel';

interface Props {
  isActive: boolean;
}

const SubscriptionStatusBadge = ({ isActive }: Props) => (
  <StatusLabel status={isActive ? 'success' : 'neutral'} className="py-0.75">
    {isActive ? 'Active' : 'Expired'}
  </StatusLabel>
);

export default SubscriptionStatusBadge;
