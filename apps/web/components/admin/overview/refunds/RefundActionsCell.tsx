'use client';

import type { PendingRefundRequest } from '@revoke.cash/core/premium/refunds';
import DismissRefundButton from './DismissRefundButton';
import ProcessRefundButton from './ProcessRefundButton';
import RecordRefundHashForm from './RecordRefundHashForm';

interface Props {
  request: PendingRefundRequest;
}

const RefundActionsCell = ({ request }: Props) => (
  <div className="flex flex-col items-end gap-1.5 py-1.5">
    <div className="flex items-center gap-1.5">
      <ProcessRefundButton request={request} />
      <DismissRefundButton request={request} />
    </div>
    <RecordRefundHashForm request={request} />
  </div>
);

export default RefundActionsCell;
