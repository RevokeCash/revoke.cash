import DonateButton from 'components/common/DonateButton';
import type { Translate } from 'next-translate';
import type { MutableRefObject, ReactText } from 'react';
import { toast } from 'react-toastify';

export const displayTransactionSubmittedToast = (ref: MutableRefObject<ReactText>, t: Translate) => {
  const toastContent = (
    <div className="flex flex-col justify-center items-center gap-2">
      <div>{t('common:toasts.transaction_submitted')}</div>
      <div>
        <DonateButton size="sm" parentToastRef={ref} />
      </div>
    </div>
  );

  ref.current = toast.info(toastContent, {
    closeOnClick: false,
  });
};
