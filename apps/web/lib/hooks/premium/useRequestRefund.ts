import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ky from 'lib/ky';
import analytics from 'lib/utils/analytics';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import type { Address } from 'viem';
import { getSubscriptionsQueryKey } from './usePremiumSubscriptions';

export const useRequestRefund = (ownerAddress: Address) => {
  const t = useTranslations();
  const queryClient = useQueryClient();

  const requestRefundMutation = useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason?: string }) => {
      return ky.post(`/api/premium/payments/${paymentId}/refund`, { json: { reason } }).json<{ id: string }>();
    },
    onSuccess: (_refundRequest, { paymentId }) => {
      analytics.track('Subscription Cancelled', { account: ownerAddress, paymentId });
      queryClient.invalidateQueries({ queryKey: getSubscriptionsQueryKey(ownerAddress) });
      toast.success(t('account.subscription.cancellation.success'));
    },
    onError: (error) => {
      toast.error(parseErrorMessage(error) || t('account.subscription.cancellation.error_fallback'));
    },
  });

  return {
    requestRefund: requestRefundMutation.mutate,
    isRequestingRefund: requestRefundMutation.isPending,
  };
};
