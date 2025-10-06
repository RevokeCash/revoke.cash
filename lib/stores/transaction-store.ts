import type { useHandleTransaction } from 'lib/hooks/ethereum/useHandleTransaction';
import type { TransactionStatus, TransactionSubmitted, TransactionType } from 'lib/interfaces';
import {
  isAccountUpgradeRejectionError,
  isBatchSizeError,
  isUserRejectionError,
  parseErrorMessage,
} from 'lib/utils/errors';
import type { Hash } from 'viem';
import { create } from 'zustand';

// TODO: Add other kinds of transactions besides "revoke" transactions to the store
// - Cancel permit
// - Cancel marketplace
// - Fee Payment
// - Update allowance vs revoke
// - Revoke session

export type TransactionResults = Record<string, TransactionResult>;

export interface TransactionResult {
  status: TransactionStatus;
  error?: string;
  transactionHash?: Hash;
}

export interface TransactionStore {
  results: TransactionResults;
  getTransaction: (key: string) => TransactionResult;
  updateTransaction: (key: string, result: TransactionResult, override?: boolean) => void;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  results: {},
  getTransaction: (key: string) => {
    return get().results[key] ?? { status: 'not_started' as const };
  },
  updateTransaction: (key: string, result: TransactionResult, override: boolean = true) => {
    set((state) => ({
      results: {
        ...state.results,
        // If a transaction is already pending or confirmed, don't override it unless an override flag is passed
        [key]:
          !state.results[key] || state.results[key].status === 'reverted' || override ? result : state.results[key],
      },
    }));
  },
}));

// Wraps the revoke function to update the transaction store and do any error handling
interface WrapTransactionProps {
  transactionKey: string;
  transactionType: TransactionType;
  executeTransaction: () => Promise<TransactionSubmitted>;
  trackTransaction: () => void;
  updateTransaction: TransactionStore['updateTransaction'];
  handleTransaction?: ReturnType<typeof useHandleTransaction>;
}

export const wrapTransaction = ({
  transactionKey,
  transactionType,
  executeTransaction,
  trackTransaction,
  updateTransaction,
  handleTransaction,
}: WrapTransactionProps) => {
  return async () => {
    try {
      updateTransaction(transactionKey, { status: 'pending' });
      const transactionPromise = executeTransaction();

      if (handleTransaction) await handleTransaction(transactionPromise, transactionType);
      const transactionSubmitted = await transactionPromise;

      updateTransaction(transactionKey, { status: 'pending', transactionHash: transactionSubmitted.hash });

      trackTransaction();

      // We don't await this, since we want to return after submitting all transactions, even if they're still pending
      transactionSubmitted.confirmation
        .then(() => {
          updateTransaction(transactionKey, {
            status: 'confirmed',
            transactionHash: transactionSubmitted.hash,
          });
        })
        .catch((reason) => {
          updateTransaction(transactionKey, { status: 'reverted', error: reason?.message });
        });

      return transactionSubmitted;
    } catch (error) {
      const message = parseErrorMessage(error);
      if (isUserRejectionError(message)) {
        updateTransaction(transactionKey, { status: 'not_started' });
      } else if (isBatchSizeError(message) || isAccountUpgradeRejectionError(message)) {
        updateTransaction(transactionKey, { status: 'retrying' });
        throw error;
      } else {
        updateTransaction(transactionKey, { status: 'reverted', error: message });
      }
    }
  };
};

export const isTransactionStatusLoadingState = (status: TransactionStatus) => {
  return status === 'pending' || status === 'retrying' || status === 'preparing';
};
