'use client';

import type { UnmatchedTransfer } from '@revoke.cash/core/premium/unmatched-transfers';
import Button from 'components/common/Button';
import Input from 'components/common/Input';
import { useDismissUnmatchedTransfer } from 'lib/hooks/admin/useAdminUnmatchedTransfers';
import { useState } from 'react';

interface Props {
  unmatchedTransfer: UnmatchedTransfer;
}

// The note records what happened with the money, for example the hash of a refund transaction or "treasury"
const DismissUnmatchedTransferButton = ({ unmatchedTransfer }: Props) => {
  const [note, setNote] = useState<string>('');
  const dismissMutation = useDismissUnmatchedTransfer();

  const handleDismiss = () => {
    const confirmed = window.confirm(
      'Dismiss this transfer? This cannot be undone, and the note cannot be changed later.',
    );
    if (!confirmed) return;
    dismissMutation.mutate({ unmatchedTransferId: unmatchedTransfer.id, note });
  };

  return (
    <div className="flex items-center gap-1.5">
      <Input
        size="sm"
        className="w-44"
        placeholder="Refund tx hash or note"
        aria-label="Dismissal note"
        maxLength={500}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <Button style="secondary" size="sm" onClick={handleDismiss} loading={dismissMutation.isPending}>
        Dismiss
      </Button>
    </div>
  );
};

export default DismissUnmatchedTransferButton;
