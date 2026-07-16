import { getSessionKey, type OnSessionRevoke, revokeSession, type Session } from '@revoke.cash/core/sessions';
import { TransactionType } from '@revoke.cash/core/types';
import { waitForTransactionConfirmation } from '@revoke.cash/core/wallet';
import { useTransactionStore, wrapTransaction } from 'lib/stores/transaction-store';
import analytics from 'lib/utils/analytics';
import { usePublicClient } from 'wagmi';
import { useEnsureWalletClient } from '../ensureWalletClient';
import { useHandleTransaction } from '../useHandleTransaction';

export const useRevokeSession = (session: Session, onRevoke: OnSessionRevoke) => {
  const { updateTransaction } = useTransactionStore();
  const publicClient = usePublicClient({ chainId: session.chainId })!;
  const { ensureWalletClient } = useEnsureWalletClient();

  const handleTransaction = useHandleTransaction(session.chainId);

  const revoke = wrapTransaction({
    transactionKey: getSessionKey(session),
    transactionType: TransactionType.SESSION_REVOKE,
    executeTransaction: async () => {
      const walletClient = await ensureWalletClient(session.chainId);
      const hash = await revokeSession(session, walletClient, publicClient);

      const waitForConfirmation = async () => {
        const transactionReceipt = await waitForTransactionConfirmation(hash, publicClient);
        onRevoke(session);
        return transactionReceipt;
      };

      return { hash, confirmation: waitForConfirmation() };
    },
    trackTransaction: () => {
      analytics.track('Session Revoked', {
        chainId: session.chainId,
        account: session.account,
        validatorAddress: session.validatorAddress,
        sessionHash: session.payload.sessionHash,
      });
    },
    updateTransaction,
    handleTransaction,
  });

  return { revoke };
};
