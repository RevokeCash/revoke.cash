import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Spinner from 'components/common/Spinner';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import type { TransactionStatus } from 'lib/interfaces';
import { isTransactionStatusLoadingState } from 'lib/stores/transaction-store';
import { useMemo } from 'react';

interface Props {
  status: TransactionStatus;
  reason?: string;
}

const StatusCell = ({ status, reason }: Props) => {
  const content = useMemo(() => {
    if (isTransactionStatusLoadingState(status)) {
      return <Spinner className="w-4 h-4" />;
    }

    if (status === 'confirmed') {
      return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
    }

    if (status === 'reverted') {
      return <XCircleIcon className="w-6 h-6 text-red-500" />;
    }

    return <div>-</div>;
  }, [status]);

  if (reason) {
    return <WithHoverTooltip tooltip={reason}>{content}</WithHoverTooltip>;
  }

  return content;
};

export default StatusCell;
