import { track } from '@amplitude/analytics-browser';
import { displayTransactionSubmittedToast } from 'components/common/transaction-submitted-toast';
import { BigNumber, Contract } from 'ethers';
import { ADDRESS_ZERO } from 'lib/constants';
import { useEthereum } from 'lib/hooks/useEthereum';
import type { ITokenAllowance, TokenData } from 'lib/interfaces';
import { isERC20Allowance, isERC20Token, isERC721Allowance, isERC721Token } from 'lib/interfaces';
import { fromFloat } from 'lib/utils';
import { useRef, useState } from 'react';
import { toast } from 'react-toastify';

export const useRevoke = (
  token: TokenData,
  allowance: ITokenAllowance,
  onRevoke: (allowance: ITokenAllowance) => void
) => {
  const toastRef = useRef();
  const [updatedAmount, setUpdatedAmount] = useState<string | undefined>();
  const { signer, selectedChainId, account } = useEthereum();

  const { spender } = allowance;

  if (isERC20Allowance(allowance) && isERC20Token(token)) {
    const revoke = async () => update('0');
    const update = async (newAmount: string) => {
      const bnNew = BigNumber.from(fromFloat(newAmount, token.decimals));
      const writeContract = new Contract(token.contract.address, token.contract.interface, signer);

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
        console.debug(`failed, code ${code}`);
        if (code === -32000) {
          toast.error('This token does not support updating allowances, please revoke instead', {
            position: 'top-left',
          });
        }

        // ignore other errors
        console.log('Ran into issue while revoking', e);
      }

      if (tx) {
        displayTransactionSubmittedToast(toastRef);

        track(newAmount === '0' ? 'Revoked ERC20 allowance' : 'Updated ERC20 allowance', {
          chainId: selectedChainId,
          account,
          spender,
          token: token.contract.address,
          amount: newAmount === '0' ? undefined : newAmount,
        });

        await tx.wait(1);
        console.debug('Reloading data');

        if (newAmount === '0') {
          onRevoke(allowance);
        } else {
          // TODO: Update allowance order after update
          setUpdatedAmount(fromFloat(newAmount, token.decimals));
        }
      }
    };

    return { revoke, update, updatedAmount };
  } else if (isERC721Allowance(allowance) && isERC721Token(token)) {
    const { tokenId } = allowance;

    const revoke = async () => {
      const writeContract = new Contract(token.contract.address, token.contract.interface, signer);

      let tx;
      try {
        if (tokenId === undefined) {
          tx = await writeContract.functions.setApprovalForAll(spender, false);
        } else {
          tx = await writeContract.functions.approve(ADDRESS_ZERO, tokenId);
        }
      } catch (e) {
        // Ignore issues
        console.log('Ran into issue while revoking', e);
      }

      if (tx) {
        displayTransactionSubmittedToast(toastRef);

        track('Revoked ERC721 allowance', {
          chainId: selectedChainId,
          account,
          spender,
          token: token.contract.address,
          tokenId,
        });

        await tx.wait(1);

        onRevoke(allowance);
      }
    };

    return { revoke };
  } else {
    throw new Error('Mismatching token + allowance types');
  }
};
