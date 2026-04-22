'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { ToastContainer } from 'react-toastify';

const ToastifyConfig = () => (
  <ToastContainer
    toastClassName="flex items-center justify-center text-center border border-black bg-white text-zinc-900 dark:bg-black dark:border-white dark:text-zinc-100"
    progressClassName="bg-black! dark:bg-white!"
    closeButton={({ closeToast, ariaLabel }) => (
      <div className="w-6">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            closeToast(e);
          }}
          aria-label={ariaLabel}
          className="absolute top-0 right-0 m-2 w-6 h-6 text-zinc-500 hover:text-black dark:hover:text-white shrink-0"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
    )}
    position="top-right"
    icon={false}
    autoClose={5000}
    hideProgressBar={false}
    newestOnTop
    closeOnClick
    rtl={false}
    pauseOnFocusLoss
    draggable="touch"
    pauseOnHover
  />
);

export default ToastifyConfig;
