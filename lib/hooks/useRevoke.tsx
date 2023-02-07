import { track } from '@amplitude/analytics-browser';
import { displayTransactionSubmittedToast } from 'components/common/transaction-submitted-toast';
import { BigNumber, Contract } from 'ethers';
import { ADDRESS_ZERO } from 'lib/constants';
import { useEthereum } from 'lib/hooks/useEthereum';
import type { AllowanceData } from 'lib/interfaces';
import { fromFloat } from 'lib/utils';
import { isErc721Contract } from 'lib/utils/tokens';
import useTranslation from 'next-translate/useTranslation';
import { useRef } from 'react';
import { toast } from 'react-toastify';

type OnUpdate = (allowance: AllowanceData, newAmount?: string) => void;

export const useRevoke = (allowance: AllowanceData, onUpdate: OnUpdate = () => {}) => {
  const toastRef = useRef();
  const { signer, selectedChainId, account } = useEthereum();
  const { t } = useTranslation();

  const { spender, tokenId, contract, decimals } = allowance;

  if (!spender) {
    return { revoke: undefined };
  }

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
        const code = e.error?.code ?? e.code;
        const message = e.error?.message ?? e.message;
        console.debug(`failed, code ${code}`);
        if (code === -32000) {
          toast.info(t('common:toasts.revoke_failed', { message }));
        }

        // ignore other errors
        console.log('Ran into issue while revoking', e);
      }

      if (tx) {
        displayTransactionSubmittedToast(toastRef, t);

        track('Revoked ERC721 allowance', {
          chainId: selectedChainId,
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
        const code = e.error?.code ?? e.code;
        const message = e.error?.message ?? e.message;
        console.debug(`failed, code ${code}`);
        if (code === -32000) {
          const revokeFailed = t('common:toasts.revoke_failed', { message });
          const updateFailed = t('common:toasts.update_failed');
          toast.info(newAmount === '0' ? revokeFailed : updateFailed);
        }

        // ignore other errors
        console.log('Ran into issue while revoking', e);
      }

      if (tx) {
        displayTransactionSubmittedToast(toastRef, t);

        track(newAmount === '0' ? 'Revoked ERC20 allowance' : 'Updated ERC20 allowance', {
          chainId: selectedChainId,
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
