import { ChainId } from '@revoke.cash/chains';
import { ERC721_ABI, ERC1155_ABI } from 'lib/abis';
import ky from 'lib/ky';
import { createViemPublicClientForChain } from 'lib/utils/chains';
import type { Address } from 'viem';

export const canMint = async (address: Address) => {
  const client = createViemPublicClientForChain(ChainId.EthereumMainnet);
  const PUDGY_PENGUINS_ADDRESS = '0xBd3531dA5CF5857e7CfAA92426877b022e612cf8';
  const LIL_PUDGYS_ADDRESS = '0x524cAB2ec69124574082676e6F654a18df49A048';

  const pudgyBalancePromise = client.readContract({
    abi: ERC721_ABI,
    address: PUDGY_PENGUINS_ADDRESS,
    functionName: 'balanceOf',
    args: [address],
  });

  const lilPudgyBalancePromise = client.readContract({
    abi: ERC721_ABI,
    address: LIL_PUDGYS_ADDRESS,
    functionName: 'balanceOf',
    args: [address],
  });

  const [pudgyBalance, lilPudgyBalance] = await Promise.all([pudgyBalancePromise, lilPudgyBalancePromise]);

  return pudgyBalance > 0n || lilPudgyBalance > 0n;
};

export const alreadyOwnsSoulboundToken = async (address: Address) => {
  const SBT_ADDRESS = '0xD0EB70639146909A5eE1439dA1124Cb80aF2d0b9';
  const SBT_TOKEN_ID = 11n;
  const client = createViemPublicClientForChain(ChainId.PolygonMainnet);

  const balance = await client.readContract({
    abi: ERC1155_ABI,
    address: SBT_ADDRESS,
    functionName: 'balanceOf',
    args: [address, SBT_TOKEN_ID],
  });

  return balance > 0n;
};

export const checkIfAlreadyClaimedInCache = async (address: string) => {
  const response = await ky.post('/api/pudgy/check-cache', { json: { address } }).json<{ claimed: boolean }>();
  return response.claimed;
};
