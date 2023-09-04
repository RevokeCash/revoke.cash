import { track } from './analytics';
import { Erc20TokenContract } from 'lib/interfaces';
import {
  Address,
  Hex,
  Signature,
  TypedDataDomain,
  WalletClient,
  domainSeparator,
  hexToSignature,
  pad,
  toHex,
} from 'viem';
import { DAI_PERMIT_ABI } from 'lib/abis';
import { getWalletAddress, writeContractUnlessExcessiveGas } from '.';

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
  });
};

export const getPermitDomain = async (contract: Erc20TokenContract): Promise<TypedDataDomain> => {
  const verifyingContract = contract.address;
  const version = getPermitDomainVersion(verifyingContract);

  const chainId = contract.publicClient.chain.id;

  const [name, symbol, contractDomainSeparator] = await Promise.all([
    contract.publicClient.readContract({ ...contract, functionName: 'name' }),
    contract.publicClient.readContract({ ...contract, functionName: 'symbol' }),
    contract.publicClient.readContract({ ...contract, functionName: 'DOMAIN_SEPARATOR' }),
  ]);
  const salt = pad(toHex(chainId), { size: 32 });

  // Given the potential fields of a domain, we try to find the one that matches the domain separator
  const potentialDomains: TypedDataDomain[] = [
    // Expected domain separators
    { name, version, chainId, verifyingContract },
    { name, version, verifyingContract, salt },
    { name: symbol, version, chainId, verifyingContract },
    { name: symbol, version, verifyingContract, salt },

    // Without version
    { name, chainId, verifyingContract },
    { name, verifyingContract, salt },
    { name: symbol, chainId, verifyingContract },
    { name: symbol, verifyingContract, salt },

    // Without name
    { version, chainId, verifyingContract },
    { version, verifyingContract, salt },

    // Without name or version
    { chainId, verifyingContract },
    { verifyingContract, salt },

    // With both chainId and salt
    { name, version, chainId, verifyingContract, salt },
    { name: symbol, version, chainId, verifyingContract, salt },
  ];

  const domain = potentialDomains.find((domain) => domainSeparator({ domain }) === contractDomainSeparator);

  if (!domain) {
    // If the domain separator is something else, we cannot generate a valid signature
    track('Permit Domain Separator Mismatch', { name, verifyingContract, chainId });
    throw new Error('Could not determine Permit Signature data');
  }

  return domain;
};

export const getPermitDomainVersion = (verifyingContract: string) => {
  const knownDomainVersions: Record<string, string> = {
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': '2', // USDC on Ethereum
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1': '2', // DAI on Arbitrum and Optimism (perhaps other chains too)
  };

  return knownDomainVersions[verifyingContract] ?? '1';
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
