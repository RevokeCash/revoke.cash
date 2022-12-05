import { track } from '@amplitude/analytics-browser';
import { Dialog } from '@headlessui/react';
import Button from 'components/common/Button';
import Href from 'components/common/Href';
import Modal from 'components/common/Modal';
import Spinner from 'components/common/Spinner';
import { utils } from 'ethers';
import { DONATION_ADDRESS, GITCOIN_URL } from 'lib/constants';
import { useEthereum } from 'lib/hooks/useEthereum';
import { getChainNativeToken, getDefaultDonationAmount } from 'lib/utils/chains';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import type { MutableRefObject, ReactText } from 'react';
import { useEffect, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { toast } from 'react-toastify';

interface Props {
  size: 'sm' | 'md' | 'lg';
  parentToastRef?: MutableRefObject<ReactText>;
}

const DonateButton = ({ size, parentToastRef }: Props) => {
  const { t } = useTranslation();
  const { signer, connectedChainId } = useEthereum();

  const nativeToken = getChainNativeToken(connectedChainId);
  const [amount, setAmount] = useState<string>(getDefaultDonationAmount(nativeToken));

  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    if (parentToastRef) {
      toast.update(parentToastRef.current, { autoClose: false, closeButton: false, draggable: false });
    }
    setOpen(true);
  };

  const handleClose = () => {
    if (parentToastRef) toast.dismiss(parentToastRef.current);
    setOpen(false);
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
      <Button style="secondary" size={size} onClick={handleOpen} className="h-full hidden sm:block">
        {t('common:buttons.donate')}
      </Button>

      <Modal open={open} setOpen={(open) => (open ? handleOpen() : handleClose())}>
        <div className="sm:flex sm:items-start">
          <div className="text-center sm:text-left w-full flex flex-col gap-2">
            <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
              {t('dashboard:donate_to_revoke')}
            </Dialog.Title>

            <div className="mt-2 h-10 flex">
              <input
                type="number"
                step={0.01}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="grow rounded rounded-r-none border border-black px-3 py-1.5 text-gray-600 focus:outline-black"
              />
              <div className="px-3 py-1.5 border-y border-black bg-gray-300 flex justify-center items-center">
                {nativeToken}
              </div>
              <Button
                style="primary"
                size="md"
                onClick={execute}
                className="rounded-l-none max-w-16 flex justify-center items-center"
              >
                {loading ? <Spinner style="primary" /> : t('common:buttons.send')}
              </Button>
            </div>
            <div className="flex justify-end">
              <div>
                <Trans
                  i18nKey="dashboard:or_contribute_to_gitcoin"
                  components={[<Href href={GITCOIN_URL} external />]}
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DonateButton;
