import { ChainId } from '@revoke.cash/chains';
import type { TransactionSubmitted } from '@revoke.cash/core/types';
import { isNullish } from '@revoke.cash/core/utils';
import {
  type Address,
  type EstimateContractGasParameters,
  type Hash,
  type PublicClient,
  TransactionNotFoundError,
  TransactionReceiptNotFoundError,
  type WalletClient,
  type WriteContractParameters,
} from 'viem';

export const getWalletAddress = async (walletClient: WalletClient) => {
  const [address] = await walletClient.getAddresses();
  return address;
};

export const isExcessiveGas = (chainId: number, estimatedGas: bigint): boolean => {
  // Some networks do weird stuff with gas estimation, so "normal" transactions have much higher gas limits.
  const gasFactors: Record<number, bigint> = {
    [ChainId.ArbitrumNova]: 20n,
    [ChainId.ArbitrumSepolia]: 20n,
    [ChainId.FrameTestnet]: 20n,
    [ChainId.Mantle]: 2_000n,
    [ChainId.MantleTestnet]: 2_000n,
    5031: 10n, // Somnia
    [ChainId.ZERONetwork]: 20n,
    [ChainId.EtherlinkMainnet]: 10n,
  };

  const EXCESSIVE_GAS = 600_000n * (gasFactors[chainId] ?? 1n);
  return estimatedGas > EXCESSIVE_GAS;
};

export const throwIfExcessiveGas = (chainId: number, estimatedGas: bigint, tokenAddress: Address) => {
  if (isExcessiveGas(chainId, estimatedGas)) {
    console.error(`Gas limit of ${estimatedGas} is excessive (token: ${tokenAddress})`);

    // TODO: Translate this error message
    throw new Error(
      'This transaction has an excessive gas cost. It is most likely a spam token, so you do not need to revoke this approval.',
    );
  }
};

export const writeContractUnlessExcessiveGas = async (
  publicClient: PublicClient,
  walletClient: WalletClient,
  transactionRequest: WriteContractParameters,
) => {
  const estimatedGas =
    transactionRequest.gas ??
    (await publicClient.estimateContractGas(transactionRequest as EstimateContractGasParameters));
  throwIfExcessiveGas(transactionRequest.chain!.id, estimatedGas, transactionRequest.address);
  return walletClient.writeContract({ ...transactionRequest, gas: estimatedGas });
};

export const waitForTransactionConfirmation = async (hash: Hash, publicClient: PublicClient) => {
  try {
    return await publicClient.waitForTransactionReceipt({ hash });
  } catch (e) {
    // Workaround for Safe Apps, somehow they don't return the transaction receipt -- TODO: remove when fixed
    if (e instanceof TransactionNotFoundError || e instanceof TransactionReceiptNotFoundError) return;
    throw e;
  }
};

export const waitForSubmittedTransactionConfirmation = async (
  transactionSubmitted?: TransactionSubmitted | Promise<TransactionSubmitted | undefined>,
) => {
  const transaction = await transactionSubmitted;
  return transaction?.confirmation ?? null;
};

export type AccountType = 'eoa' | 'eip7702' | 'smart_contract';
export const getAccountType = async (address: Address, publicClient: PublicClient): Promise<AccountType> => {
  const code = await publicClient.getCode({ address });
  if (isNullish(code) || code === '0x') return 'eoa';
  if (code.startsWith('0xef0100')) return 'eip7702';
  return 'smart_contract';
};
