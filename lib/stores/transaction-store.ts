import type { TransactionStatus } from 'lib/interfaces';
import { type TokenAllowanceData, getAllowanceKey } from 'lib/utils/allowances';
import type { Hash } from 'viem';
import { create } from 'zustand';

// TODO: Add other kinds of transactions besides "revoke" transactions to the store

export type TransactionResults = Record<string, TransactionResult>;

export interface TransactionResult {
  status: TransactionStatus;
  error?: string;
  transactionHash?: Hash;
}

export interface TransactionStore {
  results: TransactionResults;
  getTransaction: (allowance: TokenAllowanceData) => TransactionResult;
  updateTransaction: (allowance: TokenAllowanceData, result: TransactionResult, override?: boolean) => void;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  results: {},
  getTransaction: (allowance: TokenAllowanceData) => {
    return get().results[getAllowanceKey(allowance)] ?? { status: 'not_started' as const };
  },
  updateTransaction: (allowance: TokenAllowanceData, result: TransactionResult, override: boolean = true) => {
    const key = getAllowanceKey(allowance);
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
