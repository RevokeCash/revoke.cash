import type { TransactionSubmitted } from '@revoke.cash/core/types';
import type {
  Call,
  Capabilities,
  PublicClient,
  SendTransactionParameters,
  WalletCallReceipt,
  WalletClient,
  WriteContractParameters,
} from 'viem';
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
    // TokenPocket (and potentially other wallets) bug out if the data field is left out
    data: transactionRequest.data ?? '0x',
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
    // The wallet's node can be a block ahead of ours, so the receipt is polled for rather than fetched once
    const receipt = await publicClient.waitForTransactionReceipt({ hash: walletCallReceipt.transactionHash });
    if (allowance && onUpdate) onUpdate(allowance, undefined);
    return receipt;
  };

  return {
    hash: walletCallReceipt.transactionHash,
    confirmation: awaitConfirmationAndUpdate(),
  };
};
