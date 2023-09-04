import { ADDRESS_ZERO } from 'lib/constants';
import { AllowanceData, OnUpdate, TransactionType } from 'lib/interfaces';
import { fromFloat, writeContractUnlessExcessiveGas } from 'lib/utils';
import { track } from 'lib/utils/analytics';
import { permit2Approve } from 'lib/utils/permit2';
import { isErc721Contract } from 'lib/utils/tokens';
import { useAccount, useWalletClient } from 'wagmi';
import { useHandleTransaction } from './useHandleTransaction';

export const useRevoke = (allowance: AllowanceData, onUpdate: OnUpdate = () => {}) => {
  const { data: walletClient } = useWalletClient();
  const { address: account } = useAccount();
  const handleTransaction = useHandleTransaction();

  const { contract, metadata, spender, tokenId, expiration } = allowance;

  if (!spender) {
    return { revoke: undefined };
  }

  if (isErc721Contract(contract)) {
    const revoke = async () => {
      const transactionPromise = tokenId === undefined ? executeRevokeForAll() : executeRevokeSingle();
      const hash = await handleTransaction(transactionPromise, TransactionType.REVOKE);

      if (hash) {
        track('Revoked ERC721 allowance', {
          chainId: allowance.chainId,
          account,
          spender,
          token: contract.address,
          tokenId,
        });

        await contract.publicClient.waitForTransactionReceipt({ hash });

        onUpdate(allowance, undefined);
      }
    };

    const executeRevokeSingle = async () => {
      return writeContractUnlessExcessiveGas(contract.publicClient, walletClient, {
        ...contract,
        functionName: 'approve',
        args: [ADDRESS_ZERO, tokenId],
        account: allowance.owner,
        chain: walletClient.chain,
      });
    };

    const executeRevokeForAll = async () => {
      return writeContractUnlessExcessiveGas(contract.publicClient, walletClient, {
        ...contract,
        functionName: 'setApprovalForAll',
        args: [spender, false],
        account: allowance.owner,
        chain: walletClient.chain,
      });
    };

    return { revoke };
  } else {
    const revoke = async () => update('0');
    const update = async (newAmount: string) => {
      const newAmountParsed = fromFloat(newAmount, metadata.decimals);

      console.debug(`Calling contract.approve(${spender}, ${newAmountParsed})`);

      const executeUpdate = async () => {
        return writeContractUnlessExcessiveGas(contract.publicClient, walletClient, {
          ...contract,
          functionName: 'approve',
          args: [spender, newAmountParsed],
          account: allowance.owner,
          chain: walletClient.chain,
        });
      };

      // If this is a permit2 approval, then we need to update it through Permit2
      const executePermit2Update = () => permit2Approve(walletClient, contract, spender, newAmountParsed, expiration);
      const transactionPromise = expiration === undefined ? executeUpdate() : executePermit2Update();

      const transactionType = newAmount === '0' ? TransactionType.REVOKE : TransactionType.UPDATE;
      const hash = await handleTransaction(transactionPromise, transactionType);

      if (hash) {
        track(newAmount === '0' ? 'Revoked ERC20 allowance' : 'Updated ERC20 allowance', {
          chainId: allowance.chainId,
          account,
          spender,
          token: contract.address,
          amount: newAmount === '0' ? undefined : newAmount,
          permit2: expiration !== undefined,
        });

        await contract.publicClient.waitForTransactionReceipt({ hash });
        console.debug('Reloading data');

        onUpdate(allowance, newAmountParsed);
      }
    };

    return { revoke, update };
  }
};
