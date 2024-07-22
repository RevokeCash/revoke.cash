'use client';

import { Dialog } from '@headlessui/react';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import { DONATION_ADDRESS } from 'lib/constants';
import { getWalletAddress } from 'lib/utils';
import { track } from 'lib/utils/analytics';
import { getChainName, getChainNativeToken, getDefaultDonationAmount } from 'lib/utils/chains';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { toast } from 'react-toastify';
import { parseEther } from 'viem';
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import Input from '../Input';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DonateModal = ({ open, setOpen }: Props) => {
  const t = useTranslations();
  const { chain } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();

  const nativeToken = getChainNativeToken(chainId);
  const [amount, setAmount] = useState<string>(getDefaultDonationAmount(nativeToken));

  useEffect(() => {
    setAmount(getDefaultDonationAmount(nativeToken));
  }, [nativeToken]);

  const sendDonation = async () => {
    if (!walletClient) {
      alert('Please connect your web3 wallet to a supported network');
    }

    try {
      await walletClient.sendTransaction({
        account: await getWalletAddress(walletClient),
        to: DONATION_ADDRESS,
        value: parseEther(amount),
        chain,
        kzg: undefined, // TODO: Idk why I need to add this, but since Viem v2 it's required 😅
      });

      toast.info(t('common.toasts.donation_sent'));

      track('Donated', { chainName: getChainName(chainId), nativeToken, amount: Number(amount) });

      setOpen(false);
    } catch (err) {
      if (err.code && err.code === 'INVALID_ARGUMENT') {
        alert('Input is not a valid number');
      }

      console.log(err);
    }
  };

  const { execute, loading } = useAsyncCallback(sendDonation);

  return (
    <Modal open={open} setOpen={setOpen}>
      <div className="sm:flex sm:items-start">
        <div className="w-full flex flex-col gap-2 pb-2">
          <Dialog.Title as="h2" className="text-center text-2xl">
            {t('common.donate.title')}
          </Dialog.Title>

          <div className="h-9 flex">
            <Input
              size="md"
              type="number"
              step={0.01}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="z-10 rounded-r-none text-zinc-600 dark:text-zinc-400 w-full"
              aria-label="Input Donation Amount"
            />
            {nativeToken ? (
              <div className="px-3 py-1.5 border-y border-black dark:border-white bg-zinc-300 dark:bg-zinc-700 flex justify-center items-center">
                {nativeToken}
              </div>
            ) : null}
            <Button
              loading={loading}
              style="primary"
              size="md"
              onClick={execute}
              className="rounded-l-none max-w-24 flex justify-center items-center"
            >
              {loading ? t('common.buttons.sending') : t('common.buttons.send')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DonateModal;
