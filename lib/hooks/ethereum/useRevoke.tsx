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
      await contract.estimateGas.approve(ADDRESS_ZERO, tokenId).then(throwIfExcessiveGas);
      const writeContract = new Contract(contract.address, contract.interface, signer);
      return writeContract.functions.approve(ADDRESS_ZERO, tokenId);
    };

    const executeRevokeForAll = async () => {
      await contract.estimateGas.setApprovalForAll(spender, false).then(throwIfExcessiveGas);
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

      const transactionPromise = contract.estimateGas
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
  // Initially I chose 300k, but apparently zkSync does some weird stuff that estimates it at 500k gas, so we're a bit higher now
  const EXCESSIVE_GAS = 1_000_000;

  // TODO: Translate this error message
  if (estimatedGas.gt(EXCESSIVE_GAS)) {
    throw new Error(
      'This transaction has an excessive gas cost. It is most likely a spam token, so you do not need to revoke this approval.'
    );
  }
};
