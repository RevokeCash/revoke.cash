import { track } from '@amplitude/analytics-browser';
import { displayTransactionSubmittedToast } from 'components/common/transaction-submitted-toast';
import { BigNumber, Contract } from 'ethers';
import { ADDRESS_ZERO } from 'lib/constants';
import type { AllowanceData } from 'lib/interfaces';
import { fromFloat } from 'lib/utils';
import { isRevertedError, isUserRejectionError } from 'lib/utils/errors';
import { isErc721Contract } from 'lib/utils/tokens';
import useTranslation from 'next-translate/useTranslation';
import { useRef } from 'react';
import { toast } from 'react-toastify';
import { useAccount, useSigner } from 'wagmi';

type OnUpdate = (allowance: AllowanceData, newAmount?: string) => void;

export const useRevoke = (allowance: AllowanceData, onUpdate: OnUpdate = () => {}) => {
  const toastRef = useRef();
  const { data: signer } = useSigner();
  const { address: account } = useAccount();
  const { t } = useTranslation();

  const { spender, tokenId, contract, decimals } = allowance;

  if (!spender) {
    return { revoke: undefined };
  }

  const checkError = (e: any, isUpdate: boolean): void => {
    const code = e.error?.code ?? e.code;
    const message = e.error?.reason ?? e.reason ?? e.error?.message ?? e.message;
    console.debug(`Ran into issue while revoking, message: ${message} (${code})`);
    console.debug(JSON.stringify(e));

    // Don't show error toasts for user denied transactions
    if (isUserRejectionError(e)) return;

    if (isUpdate) return void toast.info(t<string>('common:toasts.update_failed'));
    if (isRevertedError(e)) return void toast.info(t<string>('common:toasts.revoke_failed_revert', { message }));
    return void toast.info(t<string>('common:toasts.revoke_failed', { message }));
  };

  if (isErc721Contract(contract)) {
    const revoke = async () => {
      const writeContract = new Contract(contract.address, contract.interface, signer);

      let tx;
      try {
        if (tokenId === undefined) {
          tx = await writeContract.functions.setApprovalForAll(spender, false);
        } else {
          tx = await writeContract.functions.approve(ADDRESS_ZERO, tokenId);
        }
      } catch (e) {
        checkError(e, false);
      }

      if (tx) {
        displayTransactionSubmittedToast(toastRef, t);

        track('Revoked ERC721 allowance', {
          chainId: allowance.chainId,
          account,
          spender,
          token: contract.address,
          tokenId,
        });

        await tx.wait(1);

        onUpdate(allowance, undefined);
      }
    };

    return { revoke };
  } else {
    const revoke = async () => update('0');
    const update = async (newAmount: string) => {
      const bnNew = BigNumber.from(fromFloat(newAmount, decimals));
      const writeContract = new Contract(contract.address, contract.interface, signer);

      let tx;
      // Not all ERC20 contracts allow for simple changes in approval to be made
      // https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
      // so we tell the user to revoke instead if the contract doesn't allow the simple use
      // of contract.approve(0)
      try {
        console.debug(`Calling contract.approve(${spender}, ${bnNew.toString()})`);
        tx = await writeContract.functions.approve(spender, bnNew);
      } catch (e) {
        const isUpdate = newAmount !== '0';
        checkError(e, isUpdate);
      }

      if (tx) {
        displayTransactionSubmittedToast(toastRef, t);

        track(newAmount === '0' ? 'Revoked ERC20 allowance' : 'Updated ERC20 allowance', {
          chainId: allowance.chainId,
          account,
          spender,
          token: contract.address,
          amount: newAmount === '0' ? undefined : newAmount,
        });

        await tx.wait(1);
        console.debug('Reloading data');

        onUpdate(allowance, bnNew.toString());
      }
    };

    return { revoke, update };
  }
};
