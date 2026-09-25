import { ERC1155_ABI } from '@revoke.cash/core/abis';
import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import { ChainId } from '@revoke.cash/core/chains/ids';
import { type Address, parseEther } from 'viem';

// Anyone can mint, as long as the address is a real wallet. So it has sent at least one transaction on Ethereum,
// or it holds more than 0.001 ETH (for receive-only wallets)
export const canMint = async (address: Address) => {
  const client = createViemPublicClientForChain(ChainId.Ethereum);
  const MINIMUM_BALANCE = parseEther('0.001');

  const [nonce, balance] = await Promise.all([client.getTransactionCount({ address }), client.getBalance({ address })]);

  return nonce > 0 || balance > MINIMUM_BALANCE;
};

export const alreadyOwnsSoulboundToken = async (address: Address) => {
  const SBT_ADDRESS = '0xD0EB70639146909A5eE1439dA1124Cb80aF2d0b9';
  const SBT_TOKEN_ID = 11n;
  const client = createViemPublicClientForChain(ChainId.Polygon);

  const balance = await client.readContract({
    abi: ERC1155_ABI,
    address: SBT_ADDRESS,
    functionName: 'balanceOf',
    args: [address, SBT_TOKEN_ID],
  });

  return balance > 0n;
};
