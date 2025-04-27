'use client';

import type { Delegation } from 'lib/delegate/DelegatePlatform';
import { createDelegatePlatforms } from 'lib/delegate/DelegatePlatformFactory';
import { TransactionType } from 'lib/interfaces';
import { useTransactionStore, wrapTransaction } from 'lib/stores/transaction-store';
import { waitForTransactionConfirmation, writeContractUnlessExcessiveGas } from 'lib/utils';
import analytics from 'lib/utils/analytics';
import { usePublicClient, useWalletClient } from 'wagmi';
import { useHandleTransaction } from './useHandleTransaction';

// Function to generate a unique key for a delegation
const getDelegationKey = (delegation: Delegation) => {
  return `${delegation.platform}-${delegation.type}-${delegation.delegator}-${delegation.delegate}-${delegation.contract || 'null'}-${delegation.tokenId || 'null'}`;
};

// Function to generate a key for revoking all delegations
const getRevokeAllKey = (platform: string, chainId: number) => {
  return `revoke-all-${platform}-${chainId}`;
};

export const useRevokeDelegation = (delegation: Delegation, onRevoke: (delegation: Delegation) => void) => {
  const { updateTransaction } = useTransactionStore();
  const publicClient = usePublicClient({ chainId: delegation.chainId })!;
  const { data: walletClient } = useWalletClient();
  const handleTransaction = useHandleTransaction(delegation.chainId);

  // Create revoking function for a single delegation
  const revoke = wrapTransaction({
    transactionKey: getDelegationKey(delegation),
    transactionType: TransactionType.REVOKE,
    executeTransaction: async () => {
      if (!walletClient) throw new Error('No wallet client available');

      // Get the appropriate delegate platform
      const platforms = createDelegatePlatforms(publicClient, delegation.chainId);
      const platform = platforms.find((p) => p.constructor.name === delegation.platform.replace('.', ''));

      if (!platform) {
        throw new Error(`Platform ${delegation.platform} not found for chain ${delegation.chainId}`);
      }

      // Get transaction parameters from the platform
      const txData = await platform.revokeDelegation(delegation);

      // Get the connected wallet address
      const [account] = await walletClient.getAddresses();

      // Execute the transaction using the existing utility
      const hash = await writeContractUnlessExcessiveGas(publicClient, walletClient, {
        ...txData,
        chain: publicClient.chain,
        account,
      });

      const waitForConfirmation = async () => {
        const receipt = await waitForTransactionConfirmation(hash, publicClient);
        onRevoke(delegation);
        return receipt;
      };

      return { hash, confirmation: waitForConfirmation() };
    },
    trackTransaction: () => {
      // Track analytics for the delegation revocation
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

// Hook for revoking all delegations from a specific platform
export const useRevokeAllDelegations = (platformName: string, chainId: number, onRevoke: () => void) => {
  const { updateTransaction } = useTransactionStore();
  const publicClient = usePublicClient({ chainId })!;
  const { data: walletClient } = useWalletClient();
  const handleTransaction = useHandleTransaction(chainId);

  // Create revoking function for all delegations
  const revokeAll = wrapTransaction({
    transactionKey: getRevokeAllKey(platformName, chainId),
    transactionType: TransactionType.REVOKE,
    executeTransaction: async () => {
      if (!walletClient) throw new Error('No wallet client available');

      // Get the appropriate delegate platform
      const platforms = createDelegatePlatforms(publicClient, chainId);
      const platform = platforms.find((p) => p.constructor.name === platformName.replace('.', ''));

      if (!platform) {
        throw new Error(`Platform ${platformName} not found for chain ${chainId}`);
      }

      // Get transaction parameters for revoking all delegations
      const txData = await platform.revokeAllDelegations();

      // Get the connected wallet address
      const [account] = await walletClient.getAddresses();

      // Execute the transaction using the existing utility
      const hash = await writeContractUnlessExcessiveGas(publicClient, walletClient, {
        ...txData,
        chain: publicClient.chain,
        account,
      });

      const waitForConfirmation = async () => {
        const receipt = await waitForTransactionConfirmation(hash, publicClient);
        onRevoke(); // Callback after successful revocation
        return receipt;
      };

      return { hash, confirmation: waitForConfirmation() };
    },
    trackTransaction: () => {
      // Track analytics for revoking all delegations
      analytics.track('All Delegations Revoked', {
        chainId,
        platform: platformName,
      });
    },
    updateTransaction,
    handleTransaction,
  });

  return { revokeAll };
};
