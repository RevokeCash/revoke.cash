import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { getChainExplorerUrl } from '@revoke.cash/core/chains';
import { isSafeConnection } from 'lib/utils/wallet';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import Href from './Href';

interface Props {
  chainId: number;
  transactionHash: string;
}

const TransactionSubmittedToast = ({ chainId, transactionHash }: Props) => {
  const t = useTranslations();

  // A Safe returns a safeTxHash that block explorers do not know, and the Safe UI already tracks the transaction
  if (isSafeConnection()) {
    return <div className="text-center">{t('common.toasts.transaction_submitted_safe')}</div>;
  }

  const explorerUrl = getChainExplorerUrl(chainId);

  return (
    <div className="flex flex-col justify-center items-center gap-2">
      <div className="flex gap-1">
        <div>{t('common.toasts.transaction_submitted')}</div>
        <Href href={`${explorerUrl}/tx/${transactionHash}`} external>
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </Href>
      </div>
    </div>
  );
};

export default TransactionSubmittedToast;

export const displayTransactionSubmittedToast = (chainId: number, transactionHash: string) => {
  toast.info(<TransactionSubmittedToast chainId={chainId} transactionHash={transactionHash} />, {
    closeOnClick: false,
  });
};
