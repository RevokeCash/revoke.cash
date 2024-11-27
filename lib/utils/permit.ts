import { DAI_PERMIT_ABI } from 'lib/abis';
import { ADDRESS_ZERO_PADDED, DUMMY_ADDRESS_PADDED } from 'lib/constants';
import blocksDB from 'lib/databases/blocks';
import type { BaseTokenData, Erc20TokenContract, Log } from 'lib/interfaces';
import { type Address, type Hex, type Signature, type TypedDataDomain, type WalletClient, hexToSignature } from 'viem';
import { getWalletAddress, logSorterChronological, writeContractUnlessExcessiveGas } from '.';
import { getPermitDomain } from './tokens';

export const permit = async (
  walletClient: WalletClient,
  contract: Erc20TokenContract,
  spender: Address,
  value: bigint,
) => {
  const verifyingContract = contract.address;
  const deadline = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

  const address = await getWalletAddress(walletClient);

  const [domain, nonce] = await Promise.all([
    getPermitDomain(contract),
    contract.publicClient.readContract({ ...contract, functionName: 'nonces', args: [address] }),
  ]);

  const DAI_ADDRESSES = [
    '0x6B175474E89094C44Da98b954EedeAC495271d0F', // Ethereum
    '0x490e379C9cFF64944bE82b849F8FD5972C7999A7', // Polygon
  ];

  // DAI uses a different form of permit
  if (DAI_ADDRESSES.includes(verifyingContract)) {
    const { v, r, s } = await signDaiPermit(walletClient, domain, address, spender, nonce, deadline, false);
    return walletClient.writeContract({
      ...contract,
      account: address,
      abi: DAI_PERMIT_ABI,
      functionName: 'permit',
      args: [address, spender, BigInt(nonce), BigInt(deadline), false, Number(v), r as Hex, s as Hex],
      chain: walletClient.chain,
    });
  }

  const { v, r, s } = await signEIP2612Permit(walletClient, domain, address, spender, value, nonce, deadline);

  return writeContractUnlessExcessiveGas(contract.publicClient, walletClient, {
    ...contract,
    account: address,
    functionName: 'permit',
    args: [address, spender, value, deadline, Number(v), r, s],
    chain: walletClient.chain,
    value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
  });
};

export const signEIP2612Permit = async (
  walletClient: WalletClient,
  domain: TypedDataDomain,
  owner: Address,
  spender: Address,
  value: bigint,
  nonce: bigint,
  deadline: bigint,
): Promise<Signature> => {
  const account = await getWalletAddress(walletClient);

  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  };

  const signatureHex = await walletClient.signTypedData({
    account,
    domain,
    types,
    primaryType: 'Permit',
    message: { owner, spender, value, nonce, deadline },
  });

  return hexToSignature(signatureHex);
};

export const signDaiPermit = async (
  walletClient: WalletClient,
  domain: TypedDataDomain,
  holder: Address,
  spender: Address,
  nonce: bigint,
  expiry: bigint,
  allowed: boolean,
): Promise<Signature> => {
  const account = await getWalletAddress(walletClient);

  const types = {
    Permit: [
      { name: 'holder', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
      { name: 'allowed', type: 'bool' },
    ],
  };

  const signatureHex = await walletClient.signTypedData({
    account,
    domain,
    types,
    primaryType: 'Permit',
    message: { holder, spender, nonce, expiry, allowed },
  });

  return hexToSignature(signatureHex);
};

export const getLastCancelled = async (approvalEvents: Log[], token: BaseTokenData): Promise<Log> => {
  const lastCancelledEvent = approvalEvents
    .filter((event) => event.address === token.contract.address && isCancelPermitEvent(event))
    .sort(logSorterChronological)
    .at(-1);

  if (!lastCancelledEvent) return null;

  const timestamp = await blocksDB.getLogTimestamp(token.contract.publicClient, lastCancelledEvent);

  return { ...lastCancelledEvent, timestamp };
};

const isCancelPermitEvent = (event: Log) => {
  const hasDummySpender = event.topics[2] === DUMMY_ADDRESS_PADDED;
  const hasZeroValue = event.data === ADDRESS_ZERO_PADDED || event.data === '0x';
  return hasDummySpender && hasZeroValue;
};
