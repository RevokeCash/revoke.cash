import type { PaymentIntentStatus } from 'lib/premium/types';

const STATUS_CLASSES: Record<PaymentIntentStatus['status'], string> = {
  confirmed: 'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100',
  pending: 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100',
  expired: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100',
  failed: 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100',
};

const PaymentStatusBadge = ({ status }: { status: PaymentIntentStatus['status'] }) => {
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-md capitalize ${STATUS_CLASSES[status]}`}>{status}</span>
  );
};

export default PaymentStatusBadge;
