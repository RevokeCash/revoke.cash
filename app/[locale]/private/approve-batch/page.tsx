'use client';

import ContentPageLayout from 'app/layouts/ContentPageLayout';
import Button from 'components/common/Button';
import { mapContractTransactionRequestToEip5792Call } from 'lib/utils/eip5792';
import { useState } from 'react';
import { isAddress } from 'viem';
import { useAccount, usePublicClient } from 'wagmi';
import { useWalletClient } from 'wagmi';
import { prepareApprove } from '../approve/page';

const ApprovePage = () => {
  const { data: walletClient } = useWalletClient();
  const { address: account } = useAccount();
  const publicClient = usePublicClient()!;
  const [allowancesCsv, setAllowancesCsv] = useState<string>('');

  const handleApprove = async () => {
    const allowances = parseAllowancesCsv(allowancesCsv);

    console.log(allowances);

    const transactionRequests = await Promise.all(
      allowances.map(async (allowance) =>
        prepareApprove(allowance as unknown as any, publicClient, walletClient!, account!),
      ),
    );

    console.log(transactionRequests);

    const calls = transactionRequests.map((request) => mapContractTransactionRequestToEip5792Call(request));

    const { id } = await walletClient!.sendCalls({
      calls,
    });

    const txs = await walletClient!.waitForCallsStatus({
      id,
    });

    console.log(txs);
  };

  return (
    <ContentPageLayout>
      <div className="flex flex-col gap-4 max-w-3xl mx-auto">
        <h1>Approve Arbitrary Contracts</h1>
        <p>For testing purposes only.</p>
        <p>Approval Type, Token Address, Spender Address, (Amount/Token ID), (Expiration), (Permit2 Address)</p>
        <textarea
          className="border border-black dark:border-white rounded-md p-2"
          placeholder="ERC20,0x7EA68721984E8E24932E8928106cA9005B3a4786,0xd98B590ebE0a3eD8C144170bA4122D402182976f,1000000000000000000000000000"
          value={allowancesCsv}
          onChange={(e) => setAllowancesCsv(e.target.value)}
        />
        <Button size="md" style="secondary" onClick={handleApprove}>
          Approve All
        </Button>
      </div>
    </ContentPageLayout>
  );
};

export default ApprovePage;

const parseAllowancesCsv = (csv: string) => {
  const lines = csv.split('\n').filter((line) => line.trim() !== '');
  const allowances = lines.map((line, index) => {
    const [allowanceType, tokenAddress, spenderAddress, amountOrTokenId, expiration, permit2Address] = line.split(',');
    if (
      !['ERC20', 'ERC721_ALL', 'ERC721_SINGLE', 'PERMIT2'].includes(allowanceType) ||
      !isAddress(tokenAddress) ||
      !isAddress(spenderAddress)
    ) {
      throw new Error(`Invalid approval type, token address or spender address on line ${index + 1}`);
    }

    if (allowanceType === 'ERC20') {
      if (!Number.isInteger(Number(amountOrTokenId))) {
        throw new Error(`Invalid amount on line ${index + 1}`);
      }

      return {
        allowanceType: 'ERC20',
        tokenAddress,
        spenderAddress,
        amount: BigInt(amountOrTokenId),
      };
    }

    if (allowanceType === 'ERC721_ALL') {
      return {
        allowanceType: 'ERC721_ALL',
        tokenAddress,
        spenderAddress,
      };
    }

    if (allowanceType === 'ERC721_SINGLE') {
      if (!Number.isInteger(Number(amountOrTokenId))) {
        throw new Error(`Invalid token ID on line ${index + 1}`);
      }

      return {
        allowanceType: 'ERC721_SINGLE',
        tokenAddress,
        spenderAddress,
        tokenId: BigInt(amountOrTokenId),
      };
    }

    if (allowanceType === 'PERMIT2') {
      if (
        !isAddress(permit2Address) ||
        !Number.isInteger(Number(amountOrTokenId)) ||
        !Number.isInteger(Number(expiration))
      ) {
        throw new Error(`Invalid permit2 address, amount or expiration on line ${index + 1}`);
      }

      return {
        allowanceType: 'PERMIT2',
        tokenAddress,
        spenderAddress,
        amount: BigInt(amountOrTokenId),
        expiration: BigInt(expiration),
        permit2Address,
      };
    }
  });

  return allowances;
};
