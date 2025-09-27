import { ERC20_ABI, ERC721_ABI } from 'lib/abis';
import { AllowanceType } from 'lib/utils/allowances';
import { preparePermit2Approve } from 'lib/utils/permit2';
import { type Address, type PublicClient, type WalletClient, isAddress } from 'viem';

interface ApprovalForm {
  allowanceType: AllowanceType;
  tokenAddress: string;
  spenderAddress: string;
  amount?: string | bigint;
  tokenId?: string | bigint;
  expiration?: string | bigint;
  permit2Address?: string;
}

export const prepareApprove = async (
  { allowanceType, tokenAddress, spenderAddress, amount, tokenId, expiration, permit2Address }: ApprovalForm,
  publicClient: PublicClient,
  walletClient: WalletClient,
  account: Address,
) => {
  if (!tokenAddress || !spenderAddress) {
    throw new Error('Token address and spender address are required');
  }

  if (allowanceType === AllowanceType.ERC721_SINGLE && !tokenId) {
    throw new Error('Token ID is required');
  }

  if (allowanceType === AllowanceType.PERMIT2 && (!permit2Address || !expiration || !isAddress(permit2Address))) {
    throw new Error('Permit2 address and expiration are required');
  }

  if (!isAddress(tokenAddress) || !isAddress(spenderAddress)) {
    throw new Error('Invalid address');
  }

  switch (allowanceType) {
    case AllowanceType.ERC20: {
      if (!amount) {
        throw new Error('Amount is required');
      }

      return {
        address: tokenAddress,
        account: account!,
        chain: walletClient!.chain!,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress, BigInt(amount)],
      };
    }
    case AllowanceType.PERMIT2: {
      if (!amount || !expiration || !permit2Address || !isAddress(permit2Address)) {
        throw new Error('Amount, expiration, and permit2 address are required');
      }

      const tokenContract = {
        address: tokenAddress,
        publicClient,
        abi: ERC20_ABI,
      };

      return preparePermit2Approve(
        permit2Address,
        account,
        walletClient.chain,
        tokenContract,
        spenderAddress,
        BigInt(amount),
        Number(expiration),
      );
    }
    case AllowanceType.ERC721_SINGLE: {
      if (!tokenId) {
        throw new Error('Token ID is required');
      }

      return {
        address: tokenAddress,
        account: account!,
        chain: walletClient!.chain!,
        abi: ERC721_ABI,
        functionName: 'approve',
        args: [spenderAddress, BigInt(tokenId)],
      };
    }
    case AllowanceType.ERC721_ALL: {
      return {
        address: tokenAddress,
        account: account!,
        chain: walletClient!.chain!,
        abi: ERC721_ABI,
        functionName: 'setApprovalForAll',
        args: [spenderAddress, true],
      };
    }
  }
};
