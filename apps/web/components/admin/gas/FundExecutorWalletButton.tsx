'use client';

import { DialogTitle } from '@headlessui/react';
import type { ExecutorGasBalance } from '@revoke.cash/core/admin/executor';
import { getChainName } from '@revoke.cash/core/chains';
import Button from 'components/common/Button';
import Input from 'components/common/Input';
import Modal from 'components/common/Modal';
import { formatNativeAmount, formatUsd } from 'lib/admin/format';
import { type FundExecutorWalletStep, useFundExecutorWallet } from 'lib/hooks/admin/useAdminGas';
import { useAuthSession } from 'lib/hooks/auth/useAuthSession';
import { useState } from 'react';
import { isAddressEqual, parseEther } from 'viem';
import { useConnection } from 'wagmi';

const AMOUNT_PRESETS_USD = [25, 50, 100, 200];

const STEP_LABELS: Record<FundExecutorWalletStep, string> = {
  idle: 'Send',
  awaiting_wallet: 'Awaiting wallet...',
  confirming: 'Confirming...',
};

interface Props {
  balance: ExecutorGasBalance;
}

// Tops up one executor wallet with a plain native token transfer from the connected wallet, which needs to hold the
// native token on that chain
const FundExecutorWalletButton = ({ balance }: Props) => {
  const [open, setOpen] = useState(false);
  const [amountInputUsd, setAmountInputUsd] = useState('100');
  const { address: connectedAddress } = useConnection();
  const { siweAddress } = useAuthSession();
  const { fundExecutorWallet, step } = useFundExecutorWallet();

  const chainName = getChainName(balance.chainId);
  const amountWei = getAmountWei(Number(amountInputUsd), balance.nativeTokenPriceUsd);
  const isSending = step !== 'idle';

  const handleSend = () => {
    if (amountWei === null) return;

    fundExecutorWallet(
      { chainId: balance.chainId, walletAddress: balance.address, amountWei },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <>
      <Button style="secondary" size="sm" onClick={() => setOpen(true)}>
        Fund
      </Button>
      <Modal open={open} setOpen={(isOpen) => !isSending && setOpen(isOpen)} className="sm:max-w-lg">
        <div className="flex flex-col gap-4">
          <div>
            <DialogTitle className="text-lg font-bold">Fund executor wallet</DialogTitle>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Sends {balance.nativeToken} on {chainName} from the connected wallet to the {balance.lane} lane executor
              wallet.
            </p>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Executor wallet</span>
            <span className="font-mono break-all">{balance.address}</span>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Current balance</span>
            <span>
              {balance.balance === null
                ? 'Unknown (RPC error)'
                : `${formatNativeAmount(parseEther(balance.balance), balance.nativeToken)}${balance.balanceUsd === null ? '' : ` (${formatUsd(balance.balanceUsd)})`}`}
            </span>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Amount (USD)</span>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                size="md"
                type="number"
                min={0}
                value={amountInputUsd}
                onChange={(event) => setAmountInputUsd(event.target.value)}
                aria-label="Amount in USD"
                className="w-28"
              />
              {AMOUNT_PRESETS_USD.map((presetUsd) => (
                <Button
                  key={presetUsd}
                  style="secondary"
                  size="sm"
                  onClick={() => setAmountInputUsd(String(presetUsd))}
                >
                  ${presetUsd}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            {balance.nativeTokenPriceUsd === null ? (
              <p className="text-amber-600 dark:text-amber-400">
                There is no {balance.nativeToken} price available, so the amount cannot be converted.
              </p>
            ) : (
              amountWei !== null && (
                <p>
                  Sends <span className="font-medium">{formatNativeAmount(amountWei, balance.nativeToken)}</span> at{' '}
                  {formatUsd(balance.nativeTokenPriceUsd)} per {balance.nativeToken}.
                </p>
              )
            )}
            {!connectedAddress && (
              <p className="text-amber-600 dark:text-amber-400">Connect a wallet to send the funds.</p>
            )}
            {connectedAddress && siweAddress && !isAddressEqual(connectedAddress, siweAddress) && (
              <p className="text-amber-600 dark:text-amber-400">
                The funds come from the connected wallet ({connectedAddress}), which is not the admin session address.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button style="secondary" size="md" onClick={() => setOpen(false)} disabled={isSending}>
              Cancel
            </Button>
            <Button
              style="primary"
              size="md"
              onClick={handleSend}
              loading={isSending}
              disabled={amountWei === null || !connectedAddress}
            >
              {STEP_LABELS[step]}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// Rounded to six decimals, so the wallet shows a clean amount
const getAmountWei = (amountUsd: number, nativeTokenPriceUsd: number | null): bigint | null => {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0 || !nativeTokenPriceUsd) return null;

  const amountWei = parseEther((amountUsd / nativeTokenPriceUsd).toFixed(6));
  return amountWei > 0n ? amountWei : null;
};

export default FundExecutorWalletButton;
