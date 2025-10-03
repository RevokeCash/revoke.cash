'use client';

import { Dialog } from '@headlessui/react';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useDonate } from 'lib/hooks/ethereum/useDonate';
import { useNativeTokenPrice } from 'lib/hooks/ethereum/useNativeTokenPrice';
import { formatDonationTokenAmount } from 'lib/utils/formatting';
import { useTranslations } from 'next-intl';
import { memo, useMemo, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { useChainId } from 'wagmi';
import Input from '../Input';
import RichText from '../RichText';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  type: DonateButtonType;
}

export type DonateButtonType = 'menu-button' | 'batch-revoke-tip';

const DonateModal = ({ open, setOpen, type }: Props) => {
  const t = useTranslations();
  const chainId = useChainId();
  const { donate, nativeToken } = useDonate(chainId, type);
  const { nativeTokenPrice } = useNativeTokenPrice(chainId);
  const [dollarAmount, setDollarAmount] = useState<string>('5');

  const tokenAmount = useMemo(() => {
    return nativeTokenPrice ? Number(dollarAmount) / nativeTokenPrice : null;
  }, [dollarAmount, nativeTokenPrice]);

  const sendDonation = async () => {
    try {
      await donate(dollarAmount);
      setOpen(false);
    } catch (err) {
      console.log(err);
    }
  };

  const { execute, loading } = useAsyncCallback(sendDonation);

  return (
    <Modal open={open} setOpen={setOpen}>
      <div className="sm:flex sm:items-start">
        <div className="w-full flex flex-col gap-4">
          <Dialog.Title as="h2" className="text-center text-2xl">
            {t('common.donate.title')}
          </Dialog.Title>
          <div className="h-9 flex border border-black dark:border-white rounded-lg overflow-hidden">
            <div className="flex justify-center items-center pl-3 text-zinc-600 dark:text-zinc-400">$</div>
            <Input
              size="none"
              type="number"
              step={1}
              min={1}
              value={dollarAmount}
              onChange={(event) => setDollarAmount(event.target.value)}
              className="z-10 px-1.5 text-zinc-900 dark:text-zinc-100 w-full border-0 focus-visible:ring-0"
              aria-label="Input Donation Amount"
            />
            {tokenAmount ? (
              <div className="flex justify-center items-center shrink-0 whitespace-nowrap pr-3 text-zinc-600 dark:text-zinc-400 text-sm">
                {`(${formatDonationTokenAmount(tokenAmount, nativeToken)})`}
              </div>
            ) : null}
            <Button
              loading={loading}
              style="primary"
              size="none"
              onClick={execute}
              className="px-4 border-0 overflow-hidden max-w-24 flex justify-center items-center"
            >
              {loading ? t('common.buttons.sending') : t('common.buttons.send')}
            </Button>
          </div>
          <div>
            <RichText>{(tags) => t.rich('common.donate.donate_any_token', tags)}</RichText>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default memo(DonateModal);
