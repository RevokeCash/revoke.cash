import { REFUND_WINDOW_DAYS } from '@revoke.cash/core/premium/payment-config';
import type { SubscriptionPayment } from '@revoke.cash/core/premium/types';
import { DAY } from '@revoke.cash/core/utils/time';

const isPaymentEligibleForCancellation = (payment: SubscriptionPayment): boolean => {
  if (!payment.paidAt) return false;
  return Date.now() < new Date(payment.paidAt).getTime() + REFUND_WINDOW_DAYS * DAY;
};

export type PaymentRefundStatus = 'final' | 'within_refund_window' | 'pending_refund' | 'refunded';

export const getPaymentRefundStatus = (payment: SubscriptionPayment): PaymentRefundStatus => {
  if (payment.refundRequest) {
    return payment.refundRequest.processedAt === null ? 'pending_refund' : 'refunded';
  }

  return isPaymentEligibleForCancellation(payment) ? 'within_refund_window' : 'final';
};

export const hasPendingRefundRequest = (payments: SubscriptionPayment[]): boolean => {
  return payments.some((payment) => getPaymentRefundStatus(payment) === 'pending_refund');
};

export const getCancellationRefund = (payments: SubscriptionPayment[]) => {
  const [latestPayment] = [...payments].sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? ''));
  const refundRequest = latestPayment?.refundRequest;

  return refundRequest?.processedAt ? { ...refundRequest, processedAt: refundRequest.processedAt } : null;
};
