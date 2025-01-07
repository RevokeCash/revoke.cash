import type { TransactionSubmitted } from 'lib/interfaces';
import type { WalletCallReceipt, WalletClient, WriteContractParameters } from 'viem';
import { type Eip5792Actions, type GetCallsStatusReturnType, eip5792Actions } from 'viem/experimental';
import type { OnUpdate } from './allowances';
import type { TokenAllowanceData } from './allowances';

export const walletSupportsEip5792 = async (walletClient: WalletClient) => {
  try {
    const extendedWalletClient = walletClient.extend(eip5792Actions());
    const capabilities = await extendedWalletClient.getCapabilities();
    console.log('Wallet supports EIP5792:', capabilities);
    return true;
  } catch (e) {
    console.log('Wallet does not support EIP5792');
    return false;
  }
};

export const pollForCallsReceipts = async (id: string, walletClient: WalletClient & Eip5792Actions) => {
  return new Promise<GetCallsStatusReturnType>((resolve) => {
    const interval = setInterval(async () => {
      const res = await walletClient.getCallsStatus({ id });
      if (res.status === 'CONFIRMED') {
        clearInterval(interval);
        resolve(res);
      }
    }, 2000);

    return () => clearInterval(interval);
  });
};

export const mapTransactionRequestToEip5792Call = (transactionRequest: WriteContractParameters) => {
  return {
    to: transactionRequest.address,
    abi: transactionRequest.abi,
    functionName: transactionRequest.functionName,
    args: transactionRequest.args,
    value: transactionRequest.value,
  };
};

export const mapWalletCallReceiptToTransactionSubmitted = (
  allowance: TokenAllowanceData,
  walletCallReceipt: WalletCallReceipt<bigint, 'success' | 'reverted'>,
  onUpdate: OnUpdate,
): TransactionSubmitted => {
  const awaitConfirmationAndUpdate = async () => {
    const receipt = await allowance.contract.publicClient.getTransactionReceipt({
      hash: walletCallReceipt.transactionHash,
    });
    onUpdate(allowance, undefined);
    return receipt;
  };

  return {
    hash: walletCallReceipt.transactionHash,
    confirmation: awaitConfirmationAndUpdate(),
  };
};
