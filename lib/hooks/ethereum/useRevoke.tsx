import { ChainId } from '@revoke.cash/chains';
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
      const estimatedGas = await contract.estimateGas.approve(ADDRESS_ZERO, tokenId, { from: allowance.owner });
      throwIfExcessiveGas(allowance.chainId, estimatedGas);

      const writeContract = new Contract(contract.address, contract.interface, signer);
      return writeContract.functions.approve(ADDRESS_ZERO, tokenId);
    };

    const executeRevokeForAll = async () => {
      const estimatedGas = await contract.estimateGas.setApprovalForAll(spender, false, { from: allowance.owner });
      throwIfExcessiveGas(allowance.chainId, estimatedGas);

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
        .approve(spender, bnNew, { from: allowance.owner })
        .then((estimatedGas) => throwIfExcessiveGas(allowance.chainId, estimatedGas))
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

const throwIfExcessiveGas = (chainId: number, estimatedGas: BigNumber) => {
  // Some networks do weird stuff with gas estimation, so "normal" transactions have much higher gas limits.
  const WEIRD_NETWORKS = [
    ChainId.ZkSyncEraMainnet,
    ChainId.ZkSyncEraTestnet,
    ChainId.ArbitrumOne,
    ChainId.ArbitrumGoerli,
    ChainId.ArbitrumNova,
  ];

  const EXCESSIVE_GAS = WEIRD_NETWORKS.includes(chainId) ? 10_000_000 : 1_000_000;

  // TODO: Translate this error message
  if (estimatedGas.gt(EXCESSIVE_GAS)) {
    console.error(`Gas limit of ${estimatedGas.toString()} is excessive`);
    throw new Error(
      'This transaction has an excessive gas cost. It is most likely a spam token, so you do not need to revoke this approval.'
    );
  }
};
