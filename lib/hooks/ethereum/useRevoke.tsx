import { ADDRESS_ZERO } from 'lib/constants';
import blocksDB from 'lib/databases/blocks';
import { AllowanceData, OnUpdate, TransactionType } from 'lib/interfaces';
import { waitForTransactionConfirmation, writeContractUnlessExcessiveGas } from 'lib/utils';
import { track } from 'lib/utils/analytics';
import { isRevertedError, parseErrorMessage } from 'lib/utils/errors';
import { parseFixedPointBigInt } from 'lib/utils/formatting';
import { permit2Approve } from 'lib/utils/permit2';
import { isErc721Contract } from 'lib/utils/tokens';
import { useAccount, useWalletClient } from 'wagmi';
import { useHandleTransaction } from './useHandleTransaction';

export const useRevoke = (allowance: AllowanceData, onUpdate: OnUpdate) => {
  const { data: walletClient } = useWalletClient();
  const { address: account } = useAccount();
  const handleTransaction = useHandleTransaction(allowance.chainId);

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

        await waitForTransactionConfirmation(hash, contract.publicClient);

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
        value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
      });
    };

    const executeRevokeForAll = async () => {
      return writeContractUnlessExcessiveGas(contract.publicClient, walletClient, {
        ...contract,
        functionName: 'setApprovalForAll',
        args: [spender, false],
        account: allowance.owner,
        chain: walletClient.chain,
        value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
      });
    };

    return { revoke };
  } else {
    const revoke = async () => update('0');
    const update = async (newAmount: string) => {
      const newAmountParsed = parseFixedPointBigInt(newAmount, metadata.decimals);
      const differenceAmount = newAmountParsed - allowance.amount;
      if (differenceAmount === 0n) return;

      const executeUpdate = async () => {
        const baseRequest = {
          ...contract,
          account: allowance.owner,
          chain: walletClient.chain,
          value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
        };

        try {
          console.debug(`Calling contract.approve(${spender}, ${newAmountParsed})`);
          return await writeContractUnlessExcessiveGas(contract.publicClient, walletClient, {
            ...baseRequest,
            functionName: 'approve',
            args: [spender, newAmountParsed],
          });
        } catch (e) {
          if (!isRevertedError(parseErrorMessage(e))) throw e;

          // Some tokens can only change approval with {increase|decrease}Approval
          if (differenceAmount > 0n) {
            console.debug(`Calling contract.increaseAllowance(${spender}, ${differenceAmount})`);
            return await writeContractUnlessExcessiveGas(contract.publicClient, walletClient, {
              ...baseRequest,
              functionName: 'increaseAllowance',
              args: [spender, differenceAmount],
            });
          } else {
            console.debug(`Calling contract.decreaseAllowance(${spender}, ${-differenceAmount})`);
            return await writeContractUnlessExcessiveGas(contract.publicClient, walletClient, {
              ...baseRequest,
              functionName: 'decreaseAllowance',
              args: [spender, -differenceAmount],
            });
          }
        }
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

        const transactionReceipt = await waitForTransactionConfirmation(hash, contract.publicClient);
        const lastUpdated = await blocksDB.getTimeLog(contract.publicClient, {
          ...transactionReceipt,
          blockNumber: Number(transactionReceipt.blockNumber),
        });

        console.debug('Reloading data');

        onUpdate(allowance, { amount: newAmountParsed, lastUpdated });
      }
    };

    return { revoke, update };
  }
};
