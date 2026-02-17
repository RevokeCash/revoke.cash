import type { TransactionSubmitted } from 'lib/interfaces';
import type {
  Capabilities,
  PublicClient,
  SendTransactionParameters,
  WalletCallReceipt,
  WalletClient,
  WriteContractParameters,
} from 'viem';
import type { Call } from 'viem/_types/types/calls';
import type { OnUpdate, TokenAllowanceData } from './allowances';

export type Eip5792Call = Call;

export const walletSupportsEip5792 = async (walletClient: WalletClient, chainId: number) => {
  try {
    const capabilities = (await walletClient.getCapabilities()) as Capabilities;
    console.log('Wallet supports EIP5792:', capabilities);

    if (capabilities[chainId]) return true;

    console.log(`Wallet does not support EIP5792 on chain ${chainId}`);
    return false;
  } catch {
    console.log('Wallet does not support EIP5792');
    return false;
  }
};

export const mapContractTransactionRequestToEip5792Call = (
  transactionRequest: WriteContractParameters,
): Eip5792Call => {
  return {
    to: transactionRequest.address,
    abi: transactionRequest.abi,
    functionName: transactionRequest.functionName,
    args: transactionRequest.args,
    value: transactionRequest.value,
  };
};

export const mapTransactionRequestToEip5792Call = (transactionRequest: SendTransactionParameters): Eip5792Call => {
  return {
    to: transactionRequest.to!,
    data: transactionRequest.data,
    value: transactionRequest.value,
  };
};

export const mapWalletCallReceiptToTransactionSubmitted = (
  walletCallReceipt: WalletCallReceipt<bigint, 'success' | 'reverted'>,
  publicClient: PublicClient,
  allowance?: TokenAllowanceData,
  onUpdate?: OnUpdate,
): TransactionSubmitted => {
  const awaitConfirmationAndUpdate = async () => {
    const receipt = await publicClient.getTransactionReceipt({ hash: walletCallReceipt.transactionHash });
    if (allowance && onUpdate) onUpdate(allowance, undefined);
    return receipt;
  };

  return {
    hash: walletCallReceipt.transactionHash,
    confirmation: awaitConfirmationAndUpdate(),
  };
};
