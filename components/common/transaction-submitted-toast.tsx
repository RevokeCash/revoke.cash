import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import DonateButton from 'components/common/DonateButton';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { getTranslations } from 'next-intl/server';
import type { MutableRefObject, ReactText } from 'react';
import { toast } from 'react-toastify';
import Href from './Href';

export const displayTransactionSubmittedToast = (
  chainId: number,
  transactionHash: string,
  ref: MutableRefObject<ReactText>,
  t: Awaited<ReturnType<typeof getTranslations<string>>>,
) => {
  const explorerUrl = getChainExplorerUrl(chainId);

  const toastContent = (
    <div className="flex flex-col justify-center items-center gap-2">
      <div className="flex gap-1">
        <div>{t('common.toasts.transaction_submitted')}</div>
        <Href href={`${explorerUrl}/tx/${transactionHash}`} external>
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </Href>
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
