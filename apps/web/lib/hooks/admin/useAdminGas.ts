'use client';

import type { GasBudgetReport } from '@revoke.cash/core/admin/gas-budgets';
import type { GasSpendReport } from '@revoke.cash/core/admin/gas-spend';
import type { GasDepositChainSummary, GasWalletChainBalance } from '@revoke.cash/core/admin/gas-wallets';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { waitForTransactionConfirmation } from '@revoke.cash/core/wallet';
import { keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query';
import { displayTransactionSubmittedToast } from 'components/common/TransactionSubmittedToast';
import { useAdminQuery } from 'lib/hooks/admin/useAdminQuery';
import { useEnsureWalletClient } from 'lib/hooks/ethereum/ensureWalletClient';
import { wagmiConfig } from 'lib/utils/wagmi';
import { useState } from 'react';
import { toast } from 'react-toastify';
import type { Address } from 'viem';
import { getPublicClient } from 'wagmi/actions';

interface AdminGasWalletReport {
  depositCount: number;
  depositSummary: GasDepositChainSummary[];
  balances: GasWalletChainBalance[];
}

export const useAdminGasSpend = (from: string, to: string) => {
  return useAdminQuery<GasSpendReport>(['admin', 'gas', 'spend', from, to], '/api/admin/gas/spend', {
    searchParams: { from, to },
    enabled: Boolean(from && to),
    placeholderData: keepPreviousData,
  });
};

export const useAdminGasBudgets = (from: string, to: string) => {
  return useAdminQuery<GasBudgetReport>(['admin', 'gas', 'budgets', from, to], '/api/admin/gas/budgets', {
    searchParams: { from, to },
    enabled: Boolean(from && to),
    placeholderData: keepPreviousData,
  });
};

export const useAdminGasWallets = (from: string, to: string) => {
  return useAdminQuery<AdminGasWalletReport>(['admin', 'gas', 'wallets', from, to], '/api/admin/gas/wallets', {
    searchParams: { from, to },
    enabled: Boolean(from && to),
    placeholderData: keepPreviousData,
  });
};

export type FundExecutorWalletStep = 'idle' | 'awaiting_wallet' | 'confirming';

interface FundExecutorWalletParams {
  chainId: number;
  walletAddress: Address;
  amountWei: bigint;
}

// Sends native tokens from the connected wallet straight to an executor wallet on the target chain
export const useFundExecutorWallet = () => {
  const queryClient = useQueryClient();
  const { ensureWalletClient } = useEnsureWalletClient();
  const [step, setStep] = useState<FundExecutorWalletStep>('idle');

  const mutation = useMutation({
    mutationFn: async ({ chainId, walletAddress, amountWei }: FundExecutorWalletParams) => {
      setStep('awaiting_wallet');
      const walletClient = await ensureWalletClient(chainId);
      const transactionHash = await walletClient.sendTransaction({
        account: walletClient.account,
        chain: walletClient.chain,
        to: walletAddress,
        value: amountWei,
        kzg: undefined,
      });

      displayTransactionSubmittedToast(chainId, transactionHash);

      setStep('confirming');
      const publicClient = getPublicClient(wagmiConfig, { chainId });
      if (!publicClient) throw new Error(`No public client available for chain ${chainId}`);
      const receipt = await waitForTransactionConfirmation(transactionHash, publicClient);
      if (receipt?.status === 'reverted') {
        throw new Error(`Funding transaction reverted on-chain: ${transactionHash}`);
      }
    },
    onSuccess: () => toast.success('Executor wallet funded'),
    onError: (error) => toast.error(parseErrorMessage(error) || 'Failed to fund the executor wallet'),
    onSettled: () => {
      setStep('idle');
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview', 'balances'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'gas', 'wallets'] });
    },
  });

  return { fundExecutorWallet: mutation.mutate, step };
};
