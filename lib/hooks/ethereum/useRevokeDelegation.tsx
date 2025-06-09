'use client';

import { AggregateDelegatePlatform } from 'lib/delegate/AggregateDelegatePlatform';
import type { Delegation } from 'lib/delegate/DelegatePlatform';
import { TransactionType } from 'lib/interfaces';
import { useTransactionStore, wrapTransaction } from 'lib/stores/transaction-store';
import { getWalletAddress, waitForTransactionConfirmation, writeContractUnlessExcessiveGas } from 'lib/utils';
import analytics from 'lib/utils/analytics';
import { usePublicClient, useWalletClient } from 'wagmi';
import { useHandleTransaction } from './useHandleTransaction';

// Function to generate a unique key for a delegation
export const getDelegationKey = (delegation: Delegation) => {
  return `${delegation.platform}-${delegation.type}-${delegation.delegator}-${delegation.delegate}-${delegation.contract || 'null'}-${delegation.tokenId || 'null'}`;
};

export const useRevokeDelegation = (delegation: Delegation, onRevoke: (delegation: Delegation) => void) => {
  const { updateTransaction } = useTransactionStore();
  const publicClient = usePublicClient({ chainId: delegation.chainId })!;
  const { data: walletClient } = useWalletClient();
  const handleTransaction = useHandleTransaction(delegation.chainId);

  // Create revoking function for a single delegation
  const revoke = wrapTransaction({
    transactionKey: getDelegationKey(delegation),
    transactionType: TransactionType.DELEGATION_REVOKE,
    executeTransaction: async () => {
      if (!walletClient) throw new Error('No wallet client available');

      const delegationPlatform = new AggregateDelegatePlatform(publicClient, delegation.chainId);
      const transactionData = await delegationPlatform.prepareRevokeDelegation(delegation);

      const hash = await writeContractUnlessExcessiveGas(publicClient, walletClient, {
        ...transactionData,
        chain: walletClient.chain,
        account: await getWalletAddress(walletClient),
      });

      const waitForConfirmation = async () => {
        const receipt = await waitForTransactionConfirmation(hash, publicClient);
        onRevoke(delegation);
        return receipt;
      };

      return { hash, confirmation: waitForConfirmation() };
    },
    trackTransaction: () => {
      analytics.track('Delegation Revoked', {
        chainId: delegation.chainId,
        delegator: delegation.delegator,
        delegate: delegation.delegate,
        type: delegation.type,
        platform: delegation.platform,
      });
    },
    updateTransaction,
    handleTransaction,
  });

  return { revoke };
};
