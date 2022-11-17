import { track } from '@amplitude/analytics-browser';
import { Dialog } from '@headlessui/react';
import Modal from 'components/common/Modal';
import Spinner from 'components/common/Spinner';
import { utils } from 'ethers';
import { DONATION_ADDRESS } from 'lib/constants';
import { useEthereum } from 'lib/hooks/useEthereum';
import { getChainNativeToken, getDefaultDonationAmount } from 'lib/utils/chains';
import useTranslation from 'next-translate/useTranslation';
import type { MutableRefObject, ReactText } from 'react';
import { useEffect, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { toast } from 'react-toastify';

interface Props {
  size?: 'sm' | 'lg';
  parentToastRef?: MutableRefObject<ReactText>;
}

const DonateButton = ({ size, parentToastRef }: Props) => {
  const { t } = useTranslation();
  const { signer, connectedChainId } = useEthereum();

  const nativeToken = getChainNativeToken(connectedChainId);
  const [amount, setAmount] = useState<string>(getDefaultDonationAmount(nativeToken));

  const [show, setShow] = useState(false);
  const handleShow = () => {
    if (parentToastRef) {
      toast.update(parentToastRef.current, { autoClose: false, closeButton: false, draggable: false });
    }
    setShow(true);
  };
  const handleClose = () => {
    if (parentToastRef) toast.dismiss(parentToastRef.current);
    setShow(false);
  };

  useEffect(() => {
    setAmount(getDefaultDonationAmount(nativeToken));
  }, [nativeToken]);

  const sendDonation = async () => {
    if (!signer || !connectedChainId) {
      alert('Please connect your web3 wallet to donate');
    }

    try {
      await signer.sendTransaction({
        to: DONATION_ADDRESS,
        from: await signer.getAddress(),
        value: utils.parseEther(amount),
      });

      toast.info('💪 Thanks for the donation!', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      track('Donated', { chainId: connectedChainId, amount: Number(amount) });

      handleClose();
    } catch (err) {
      if (err.code && err.code === 'INVALID_ARGUMENT') {
        alert('Input is not a valid number');
      }

      console.log(err);
    }
  };

  const { execute, loading } = useAsyncCallback(sendDonation);

  return (
    <>
      <button type="button" className="btn-primary h-full" onClick={handleShow}>
        {t('common:buttons.donate')}
      </button>

      {/* TODO modal for donations */}

      <Modal open_state={[show, setShow]}>
        <div className="sm:flex sm:items-start">
          {/* <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div> */}
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
            <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
              {t('dashboard:donate_to_revoke')}
            </Dialog.Title>

            <div className="mt-2 h-10">
              <form className="flex justify-between">
                <input
                  type="number"
                  step={0.01}
                  id="amount"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="grow rounded-md rounded-r-none border-2 border-gray-300 border-r-0 pl-4 text-gray-600"
                />
                <span className="px-4 py-1.5 bg-gray-300 ">{nativeToken}</span>
                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    execute();
                  }}
                  className="duration-150 w-40 rounded bg-black active:bg-black hover:bg-gray-700 py-1.5 font-medium text-white rounded-l-none    focus:outline-none"
                >
                  {loading ? (
                    <div className="flex justify-center items-center gap-x-2">
                      <p>{t('common:buttons.sending')}</p>
                      <Spinner />
                    </div>
                  ) : (
                    t('common:buttons.send')
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DonateButton;
