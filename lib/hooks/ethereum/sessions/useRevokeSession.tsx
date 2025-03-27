import { TransactionType } from 'lib/interfaces';
import { useTransactionStore, wrapTransaction } from 'lib/stores/transaction-store';
import { waitForTransactionConfirmation } from 'lib/utils';
import analytics from 'lib/utils/analytics';
import { type OnSessionRevoke, type Session, getSessionKey, revokeSession } from 'lib/utils/sessions';
import { usePublicClient, useWalletClient } from 'wagmi';
import { useHandleTransaction } from '../useHandleTransaction';

export const useRevokeSession = (session: Session, onRevoke: OnSessionRevoke) => {
  const { updateTransaction } = useTransactionStore();
  const publicClient = usePublicClient({ chainId: session.chainId })!;
  const { data: walletClient } = useWalletClient();

  const handleTransaction = useHandleTransaction(session.chainId);

  const revoke = wrapTransaction({
    transactionKey: getSessionKey(session),
    transactionType: TransactionType.SESSION_REVOKE,
    executeTransaction: async () => {
      const hash = await revokeSession(session, walletClient!, publicClient);

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
