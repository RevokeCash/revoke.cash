import type { getTranslations } from 'next-intl/server';
import { toast } from 'react-toastify';

export const writeToClipBoard = (
  text: string,
  t: Awaited<ReturnType<typeof getTranslations<string>>>,
  displayToast: boolean = true,
) => {
  if (typeof navigator === 'undefined' || !navigator?.clipboard?.writeText) {
    return void toast.error(t('common.toasts.clipboard_failed'), { autoClose: 1000 });
  }

  navigator.clipboard.writeText(text);

  if (displayToast) {
    toast.success(t('common.toasts.clipboard_success'), { autoClose: 1000 });
  }
};
