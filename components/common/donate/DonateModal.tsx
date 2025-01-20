'use client';

import { Dialog } from '@headlessui/react';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useDonate } from 'lib/hooks/ethereum/useDonate';
import { useTranslations } from 'next-intl';
import { memo, useEffect, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { useChainId } from 'wagmi';
import Input from '../Input';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  type: DonateButtonType;
}

export type DonateButtonType = 'menu-button' | 'batch-revoke-tip';

const DonateModal = ({ open, setOpen, type }: Props) => {
  const t = useTranslations();
  const chainId = useChainId();
  const { donate, nativeToken, defaultAmount } = useDonate(chainId, type);

  const [amount, setAmount] = useState<string>(defaultAmount);

  useEffect(() => {
    setAmount(defaultAmount);
  }, [defaultAmount]);

  const sendDonation = async () => {
    try {
      await donate(amount);
      setOpen(false);
    } catch (err) {
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

export default memo(DonateModal);
