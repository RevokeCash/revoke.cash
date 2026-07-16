import Button from 'components/common/Button';
import { useAdminRetryAction } from 'lib/hooks/admin/useAdminExecutor';

interface Props {
  actionId: string;
}

const RetryActionButton = ({ actionId }: Props) => {
  const retryAction = useAdminRetryAction();

  return (
    <Button style="secondary" size="sm" loading={retryAction.isPending} onClick={() => retryAction.mutate(actionId)}>
      Retry now
    </Button>
  );
};

export default RetryActionButton;
