'use client';

import type { PendingRefundRequest } from '@revoke.cash/core/premium/refunds';
import Button from 'components/common/Button';
import Input from 'components/common/Input';
import { useRecordRefund } from 'lib/hooks/admin/useAdminRefunds';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { isHash } from 'viem';

interface Props {
  request: PendingRefundRequest;
}

// Records a refund transaction that was already sent, for when the browser died between send and
// record, or when a Safe wallet returned a Safe-hash instead of the executed transaction hash
const RecordRefundHashForm = ({ request }: Props) => {
  const [refundTxHash, setRefundTxHash] = useState<string>(request.refundTxHash ?? '');
  const recordMutation = useRecordRefund();

  const handleRecord = () => {
    if (!isHash(refundTxHash)) {
      toast.error('Enter a valid transaction hash');
      return;
    }

    recordMutation.mutate({ requestId: request.id, refundTxHash });
  };

  return (
    <div className="flex items-center gap-1.5">
      <Input
        size="sm"
        className="w-44 font-mono"
        placeholder="Refund tx hash"
        aria-label="Refund transaction hash"
        value={refundTxHash}
        onChange={(event) => setRefundTxHash(event.target.value.trim())}
      />
      <Button style="secondary" size="sm" onClick={handleRecord} loading={recordMutation.isPending}>
        Record
      </Button>
    </div>
  );
};

export default RecordRefundHashForm;
