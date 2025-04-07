'use client';

import ContentPageLayout from 'app/layouts/ContentPageLayout';
import Button from 'components/common/Button';
import Input from 'components/common/Input';
import { displayTransactionSubmittedToast } from 'components/common/TransactionSubmittedToast';
import Select from 'components/common/select/Select';
import { ERC20_ABI, ERC721_ABI } from 'lib/abis';
import { writeContractUnlessExcessiveGas } from 'lib/utils';
import { AllowanceType } from 'lib/utils/allowances';
import { parseErrorMessage } from 'lib/utils/errors';
import { permit2Approve } from 'lib/utils/permit2';
import type { Erc20TokenContract } from 'lib/utils/tokens';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { isAddress } from 'viem';
import { useAccount, usePublicClient } from 'wagmi';
import { useWalletClient } from 'wagmi';

const ApprovePage = () => {
  const { data: walletClient } = useWalletClient();
  const { address: account } = useAccount();
  const publicClient = usePublicClient()!;
  const [allowanceType, setAllowanceType] = useState<AllowanceType>(AllowanceType.ERC20);
  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [spenderAddress, setSpenderAddress] = useState<string>('');
  const [permit2Address, setPermit2Address] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [tokenId, setTokenId] = useState<string>('');
  const [expiration, setExpiration] = useState<string>('');
  const options = Object.values(AllowanceType).map((type) => ({ value: type, label: type }));

  const handleApprove = async () => {
    try {
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

          const tx = await writeContractUnlessExcessiveGas(publicClient, walletClient!, {
            address: tokenAddress,
            account: account!,
            chain: walletClient!.chain!,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [spenderAddress, BigInt(amount)],
          });

          displayTransactionSubmittedToast(walletClient!.chain!.id, tx);
          break;
        }
        case AllowanceType.PERMIT2: {
          if (!amount || !expiration || !permit2Address || !isAddress(permit2Address)) {
            throw new Error('Amount, expiration, and permit2 address are required');
          }

          const tokenContract: Erc20TokenContract = {
            tokenStandard: 'ERC20',
            address: tokenAddress,
            publicClient,
            abi: ERC20_ABI,
          };

          const tx = await permit2Approve(
            permit2Address,
            walletClient!,
            tokenContract,
            spenderAddress,
            BigInt(amount),
            Number(expiration),
          );

          displayTransactionSubmittedToast(walletClient!.chain!.id, tx);
          break;
        }
        case AllowanceType.ERC721_SINGLE: {
          if (!tokenId) {
            throw new Error('Token ID is required');
          }

          const tx = await writeContractUnlessExcessiveGas(publicClient, walletClient!, {
            address: tokenAddress,
            account: account!,
            chain: walletClient!.chain!,
            abi: ERC721_ABI,
            functionName: 'approve',
            args: [spenderAddress, BigInt(tokenId)],
          });

          displayTransactionSubmittedToast(walletClient!.chain!.id, tx);
          break;
        }
        case AllowanceType.ERC721_ALL: {
          const tx = await writeContractUnlessExcessiveGas(publicClient, walletClient!, {
            address: tokenAddress,
            account: account!,
            chain: walletClient!.chain!,
            abi: ERC721_ABI,
            functionName: 'setApprovalForAll',
            args: [spenderAddress, true],
          });

          displayTransactionSubmittedToast(walletClient!.chain!.id, tx);
          break;
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? parseErrorMessage(e) : 'An error occurred');
    }
  };

  return (
    <ContentPageLayout>
      <div className="flex flex-col gap-4 max-w-3xl mx-auto">
        <h1>Approve Arbitrary Contracts</h1>
        <p>For testing purposes only.</p>
        <div className="flex flex-col gap-4 border border-zinc-200 rounded-md p-4">
          <div className="flex flex-col gap-1">
            <span>Approval Type</span>
            <Select
              instanceId="approval-type-select"
              aria-label="Select Approval Type"
              options={options}
              value={options.find((option) => option.value === allowanceType)}
              onChange={(value) => setAllowanceType(value?.value as AllowanceType)}
              isMulti={false}
              isSearchable={false}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span>Token Address</span>
            <Input
              size="md"
              placeholder="Token Address"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span>Spender Address</span>
            <Input
              size="md"
              placeholder="Spender Address"
              value={spenderAddress}
              onChange={(e) => setSpenderAddress(e.target.value)}
            />
          </div>
          {allowanceType === AllowanceType.PERMIT2 && (
            <div className="flex flex-col gap-1">
              <span>Permit2 Address</span>
              <Input
                size="md"
                placeholder="Permit2 Address"
                value={permit2Address}
                onChange={(e) => setPermit2Address(e.target.value)}
              />
            </div>
          )}
          {(allowanceType === AllowanceType.ERC20 || allowanceType === AllowanceType.PERMIT2) && (
            <div className="flex flex-col gap-1">
              <span>Amount</span>
              <Input size="md" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          )}
          {allowanceType === AllowanceType.ERC721_SINGLE && (
            <div className="flex flex-col gap-1">
              <span>Token ID</span>
              <Input size="md" placeholder="Token ID" value={tokenId} onChange={(e) => setTokenId(e.target.value)} />
            </div>
          )}
          {allowanceType === AllowanceType.PERMIT2 && (
            <div className="flex flex-col gap-1">
              <span>Expiration</span>
              <Input
                size="md"
                placeholder="Expiration"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
              />
            </div>
          )}
        </div>
        <Button size="md" style="secondary" onClick={handleApprove}>
          Approve
        </Button>
      </div>
    </ContentPageLayout>
  );
};

export default ApprovePage;
