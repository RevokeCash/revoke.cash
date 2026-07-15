'use client';

import { DialogTitle } from '@headlessui/react';
import { getChainName } from '@revoke.cash/core/chains';
import type { SubscriptionPayment } from '@revoke.cash/core/premium/types';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useRequestRefund } from 'lib/hooks/premium/useRequestRefund';
import { useTranslations } from 'next-intl';
import { type ComponentProps, cloneElement, type ReactElement, useState } from 'react';
import type { Address } from 'viem';

interface Props {
  payment: SubscriptionPayment;
  ownerAddress: Address;
  trigger: ReactElement<ComponentProps<typeof Button>>;
}

const CancelSubscriptionModal = ({ payment, ownerAddress, trigger }: Props) => {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const { requestRefund, isRequestingRefund } = useRequestRefund(ownerAddress);

  const confirmCancellation = () => {
    requestRefund(
      { paymentId: payment.id },
      {
        onSuccess: () => setOpen(false),
      },
    );
  };

  return (
    <>
      {cloneElement(trigger, { onClick: () => setOpen(true) })}
      <Modal open={open} setOpen={setOpen} className="sm:max-w-lg">
        <div className="flex flex-col gap-4">
          <div>
            <DialogTitle className="text-lg font-bold">
              {t('account.subscription.cancellation.modal_title')}
            </DialogTitle>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t('account.subscription.cancellation.modal_description', { planName: payment.planName })}
            </p>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-zinc-600 dark:text-zinc-400">
                {t('account.subscription.cancellation.refund_amount')}
              </span>
              <span className="font-medium">{formatUsdCents(payment.amountUsdCents)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-600 dark:text-zinc-400">{t('account.subscription.cancellation.network')}</span>
              <span className="font-medium">{getChainName(payment.chainId)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-zinc-600 dark:text-zinc-400">
                {t('account.subscription.cancellation.refund_destination')}
              </span>
              <span className="font-mono break-all">{ownerAddress}</span>
            </div>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t('account.subscription.cancellation.modal_access_notice')}
          </p>

          <div className="flex justify-end pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              style="primary"
              size="md"
              className="text-sm"
              onClick={confirmCancellation}
              loading={isRequestingRefund}
            >
              {t('account.subscription.cancellation.confirm_button')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CancelSubscriptionModal;
