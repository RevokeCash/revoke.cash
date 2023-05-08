import { track } from '@amplitude/analytics-browser';
import { BigNumber, Contract } from 'ethers';
import { ADDRESS_ZERO } from 'lib/constants';
import { AllowanceData, TransactionType } from 'lib/interfaces';
import { fromFloat } from 'lib/utils';
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
      const writeContract = new Contract(contract.address, contract.interface, signer);

      const transactionPromise =
        tokenId === undefined
          ? writeContract.functions.setApprovalForAll(spender, false)
          : writeContract.functions.approve(ADDRESS_ZERO, tokenId);

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

    return { revoke };
  } else {
    const revoke = async () => update('0');
    const update = async (newAmount: string) => {
      const bnNew = BigNumber.from(fromFloat(newAmount, decimals));
      const writeContract = new Contract(contract.address, contract.interface, signer);

      console.debug(`Calling contract.approve(${spender}, ${bnNew.toString()})`);
      const transactionPromise = writeContract.functions.approve(spender, bnNew);
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
