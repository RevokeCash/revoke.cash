import { BigNumber, Contract } from 'ethers';
import { ADDRESS_ZERO } from 'lib/constants';
import { AllowanceData, TransactionType } from 'lib/interfaces';
import { fromFloat } from 'lib/utils';
import { throwIfExcessiveGas } from 'lib/utils/allowances';
import { track } from 'lib/utils/analytics';
import { permit2Approve } from 'lib/utils/permit2';
import { isErc721Contract } from 'lib/utils/tokens';
import { useAccount, useSigner } from 'wagmi';
import { useHandleTransaction } from './useHandleTransaction';

type OnUpdate = (allowance: AllowanceData, newAmount?: string) => void;

export const useRevoke = (allowance: AllowanceData, onUpdate: OnUpdate = () => {}) => {
  const { data: signer } = useSigner();
  const { address: account } = useAccount();
  const handleTransaction = useHandleTransaction();

  const { spender, tokenId, contract, decimals, expiration } = allowance;

  if (!spender) {
    return { revoke: undefined };
  }

  if (isErc721Contract(contract)) {
    const revoke = async () => {
      const transactionPromise = tokenId === undefined ? executeRevokeForAll() : executeRevokeSingle();
      const transaction = await handleTransaction(transactionPromise, TransactionType.REVOKE);

      if (transaction) {
        track('Revoked ERC721 allowance', {
          chainId: allowance.chainId,
          account,
          spender,
          token: contract.address,
          tokenId,
        });

        await transaction.wait(1);

        onUpdate(allowance, undefined);
      }
    };

    const executeRevokeSingle = async () => {
      const estimatedGas = await contract.estimateGas.approve(ADDRESS_ZERO, tokenId, { from: allowance.owner });
      throwIfExcessiveGas(allowance, estimatedGas);

      const writeContract = new Contract(contract.address, contract.interface, signer);
      return writeContract.functions.approve(ADDRESS_ZERO, tokenId);
    };

    const executeRevokeForAll = async () => {
      const estimatedGas = await contract.estimateGas.setApprovalForAll(spender, false, { from: allowance.owner });
      throwIfExcessiveGas(allowance, estimatedGas);

      const writeContract = new Contract(contract.address, contract.interface, signer);
      return writeContract.functions.setApprovalForAll(spender, false);
    };

    return { revoke };
  } else {
    const revoke = async () => update('0');
    const update = async (newAmount: string) => {
      const bnNew = BigNumber.from(fromFloat(newAmount, decimals));
      const writeContract = new Contract(contract.address, contract.interface, signer);

      console.debug(`Calling contract.approve(${spender}, ${bnNew.toString()})`);

      const executeUpdate = async () => {
        return contract.estimateGas
          .approve(spender, bnNew, { from: allowance.owner })
          .then((estimatedGas) => throwIfExcessiveGas(allowance, estimatedGas))
          .then(() => writeContract.functions.approve(spender, bnNew));
      };

      // If this is a permit2 approval, then we need to update it through Permit2
      const transactionPromise =
        expiration === undefined ? executeUpdate() : permit2Approve(writeContract, spender, bnNew, expiration);

      const transactionType = newAmount === '0' ? TransactionType.REVOKE : TransactionType.UPDATE;
      const transaction = await handleTransaction(transactionPromise, transactionType);

      if (transaction) {
        track(newAmount === '0' ? 'Revoked ERC20 allowance' : 'Updated ERC20 allowance', {
          chainId: allowance.chainId,
          account,
          spender,
          token: contract.address,
          amount: newAmount === '0' ? undefined : newAmount,
          permit2: expiration !== undefined,
        });

        await transaction.wait(1);
        console.debug('Reloading data');

        onUpdate(allowance, bnNew.toString());
      }
    };

    return { revoke, update };
  }
};
