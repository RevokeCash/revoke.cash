import SubscriptionDetail from 'components/admin/subscriptions/SubscriptionDetail';

interface Props {
  params: Promise<{ id: string }>;
}

const AdminSubscriptionDetailPage = async ({ params }: Props) => {
  const { id } = await params;
  return <SubscriptionDetail subscriptionId={id} />;
};

export default AdminSubscriptionDetailPage;
