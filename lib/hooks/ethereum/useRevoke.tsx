import { BigNumber, Contract } from 'ethers';
import { ADDRESS_ZERO } from 'lib/constants';
import { AllowanceData, TransactionType } from 'lib/interfaces';
import { fromFloat } from 'lib/utils';
import { track } from 'lib/utils/analytics';
import { isErc721Contract } from 'lib/utils/tokens';
import { useAccount, useSigner } from 'wagmi';
import { useHandleTransaction } from './useHandleTransaction';

type OnUpdate = (allowance: AllowanceData, newAmount?: string) => void;

export const useRevoke = (allowance: AllowanceData, onUpdate: OnUpdate = () => {}) => {
  const { data: signer } = useSigner();
  const { address: account } = useAccount();
  const handleTransaction = useHandleTransaction();

  const { spender, tokenId, contract, decimals } = allowance;

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
      const writeContract = new Contract(contract.address, contract.interface, signer);
      await writeContract.estimateGas.approve(ADDRESS_ZERO, tokenId).then(throwIfExcessiveGas);
      return writeContract.functions.approve(ADDRESS_ZERO, tokenId);
    };

    const executeRevokeForAll = async () => {
      const writeContract = new Contract(contract.address, contract.interface, signer);
      await writeContract.estimateGas.setApprovalForAll(spender, false).then(throwIfExcessiveGas);
      return writeContract.functions.setApprovalForAll(spender, false);
    };

    return { revoke };
  } else {
    const revoke = async () => update('0');
    const update = async (newAmount: string) => {
      const bnNew = BigNumber.from(fromFloat(newAmount, decimals));
      const writeContract = new Contract(contract.address, contract.interface, signer);

      console.debug(`Calling contract.approve(${spender}, ${bnNew.toString()})`);

      const transactionPromise = writeContract.estimateGas
        .approve(spender, bnNew)
        .then(throwIfExcessiveGas)
        .then(() => writeContract.functions.approve(spender, bnNew));

      const transactionType = newAmount === '0' ? TransactionType.REVOKE : TransactionType.UPDATE;
      const transaction = await handleTransaction(transactionPromise, transactionType);

      if (transaction) {
        track(newAmount === '0' ? 'Revoked ERC20 allowance' : 'Updated ERC20 allowance', {
          chainId: allowance.chainId,
          account,
          spender,
          token: contract.address,
          amount: newAmount === '0' ? undefined : newAmount,
        });

        await transaction.wait(1);
        console.debug('Reloading data');

        onUpdate(allowance, bnNew.toString());
      }
    };

    return { revoke, update };
  }
};

const throwIfExcessiveGas = (estimatedGas: BigNumber) => {
  // This value was chosen arbitrarily, most revoke transactions use ~30k gas, so 10x that seems like a reasonable limit
  const EXCESSIVE_GAS = 300_000;

  // TODO: Translate this error message
  if (estimatedGas.gt(EXCESSIVE_GAS)) {
    throw new Error(
      'This transaction has an excessive gas cost. It is most likely a spam token, so you do not need to revoke this approval.'
    );
  }
};
