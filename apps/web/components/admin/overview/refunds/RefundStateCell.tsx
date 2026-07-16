'use client';

import type { PendingRefundRequest } from '@revoke.cash/core/premium/refunds';
import StatusLabel from 'components/common/StatusLabel';
import WithHoverTooltip from 'components/common/WithHoverTooltip';

interface Props {
  request: PendingRefundRequest;
}

const RefundStateCell = ({ request }: Props) => {
  // A non-confirmed payment (e.g. reversed after a reorg) must not be refunded; dismiss it instead
  if (request.payment.status !== 'confirmed') {
    return (
      <StatusLabel status="danger" className="py-0.75 capitalize">
        Payment {request.payment.status}
      </StatusLabel>
    );
  }

  // A recorded hash on an unprocessed request means the payment stopped being refundable after
  // the refund was sent, which needs manual review
  if (request.refundTxHash) {
    return (
      <WithHoverTooltip tooltip={<span className="font-mono">{request.refundTxHash}</span>}>
        <StatusLabel status="warning" className="py-0.75">
          Hash recorded
        </StatusLabel>
      </WithHoverTooltip>
    );
  }

  return (
    <StatusLabel status="neutral" className="py-0.75">
      Pending
    </StatusLabel>
  );
};

export default RefundStateCell;
