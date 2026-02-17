'use client';

import ContentPageLayout from 'app/layouts/ContentPageLayout';
import Button from 'components/common/Button';
import Input from 'components/common/Input';
import Select from 'components/common/select/Select';
import { displayTransactionSubmittedToast } from 'components/common/TransactionSubmittedToast';
import { writeContractUnlessExcessiveGas } from 'lib/utils';
import { AllowanceType } from 'lib/utils/allowances';
import { parseErrorMessage } from 'lib/utils/errors';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { prepareApprove } from './lib';

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
    if (!walletClient || !account) {
      throw new Error('Wallet client and account are required');
    }

    try {
      const transactionRequest = await prepareApprove(
        { allowanceType, tokenAddress, spenderAddress, amount, tokenId, expiration, permit2Address },
        publicClient,
        walletClient,
        account,
      );

      if (transactionRequest) {
        const tx = await writeContractUnlessExcessiveGas(publicClient, walletClient!, transactionRequest);
        displayTransactionSubmittedToast(walletClient!.chain!.id, tx);
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
        <div className="flex flex-col gap-4 border border-black dark:border-white rounded-md p-4">
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
