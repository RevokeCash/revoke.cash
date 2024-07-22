import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import DonateButton from 'components/common/donate/DonateButton';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { useTranslations } from 'next-intl';
import type { MutableRefObject } from 'react';
import { Id, toast } from 'react-toastify';
import Href from './Href';

interface Props {
  chainId: number;
  transactionHash: string;
  ref: MutableRefObject<Id>;
}

const TransactionSubmittedToast = ({ chainId, transactionHash, ref }: Props) => {
  const t = useTranslations();

  const explorerUrl = getChainExplorerUrl(chainId);

  return (
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
};

export default TransactionSubmittedToast;

export const displayTransactionSubmittedToast = (
  chainId: number,
  transactionHash: string,
  ref: MutableRefObject<Id>,
) => {
  ref.current = toast.info(
    <TransactionSubmittedToast chainId={chainId} transactionHash={transactionHash} ref={ref} />,
    {
      closeOnClick: false,
    },
  );
  console.log(ref.current);
};
