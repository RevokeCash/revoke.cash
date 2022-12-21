import DonateButton from 'components/common/DonateButton';
import type { MutableRefObject, ReactText } from 'react';
import { toast } from 'react-toastify';

export const displayTransactionSubmittedToast = (ref: MutableRefObject<ReactText>) => {
  const toastContent = (
    <div className="flex flex-col justify-center items-center gap-2">
      <div>
        <span role="img" aria-label="check">
          ✅
        </span>{' '}
        Transaction submitted!
      </div>
      <div>
        <DonateButton size="sm" parentToastRef={ref} />
      </div>
    </div>
  );

  ref.current = toast.info(toastContent, {
    closeOnClick: false,
  });
};
