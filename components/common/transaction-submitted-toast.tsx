import DonateButton from 'components/DonateButton/DonateButton';
import React, { MutableRefObject, ReactText } from 'react';
import { toast } from 'react-toastify';

export const displayTransactionSubmittedToast = (ref: MutableRefObject<ReactText>) => {
  const toastContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
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
    position: 'top-right',
    autoClose: 5000,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
  });
};
