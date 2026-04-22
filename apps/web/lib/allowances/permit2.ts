import { preparePermit2Approve } from '@revoke.cash/core/allowances/permit2';
import type { Erc20TokenContract } from '@revoke.cash/core/tokens';
import { getWalletAddress, writeContractUnlessExcessiveGas } from '@revoke.cash/core/wallet';
import type { Address, WalletClient } from 'viem';

export const permit2Approve = async (
  permit2Address: Address,
  walletClient: WalletClient,
  tokenContract: Erc20TokenContract,
  spender: Address,
  amount: bigint,
  expiration: number,
) => {
  const transactionRequest = await preparePermit2Approve(
    permit2Address,
    await getWalletAddress(walletClient),
    walletClient.chain,
    tokenContract,
    spender,
    amount,
    expiration,
  );

  return writeContractUnlessExcessiveGas(tokenContract.publicClient, walletClient, transactionRequest);
};
