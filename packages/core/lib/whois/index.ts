import { ChainId } from '@revoke.cash/chains';
import { AVVY_DOMAINS_ABI, UNSTOPPABLE_DOMAINS_ABI } from '@revoke.cash/core/abis';
import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import {
  ALCHEMY_API_KEY,
  AVVY_DOMAINS_ADDRESS,
  UNSTOPPABLE_DOMAINS_ETH_ADDRESS,
  UNSTOPPABLE_DOMAINS_POLYGON_ADDRESS,
} from '@revoke.cash/core/constants';
import type { RiskFactor } from '@revoke.cash/core/risk';
import type { Nullable } from '@revoke.cash/core/types';
import {
  AggregateSpenderDataSource,
  AggregationType,
} from '@revoke.cash/core/whois/spender/AggregateSpenderDataSource';
import { BackendSpenderDataSource } from '@revoke.cash/core/whois/spender/BackendSpenderDataSource';
import { UNSTOPPABLE_TLDS } from '@revoke.cash/core/whois/unstoppable-tlds';
import { type Address, getAddress, isAddress, type PublicClient } from 'viem';
import { namehash, normalize } from 'viem/ens';

export interface SpenderData extends SpenderRiskData {
  name: string;
}

export interface SpenderRiskData {
  name?: string;
  riskFactors?: Array<RiskFactor>;
}

// Note that we do not use the official UD or Avvy resolution libraries below because they are big and use Ethers.js

const GlobalClients = {
  ETHEREUM: createViemPublicClientForChain(
    ChainId.EthereumMainnet,
    `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  )!,
  POLYGON: createViemPublicClientForChain(
    ChainId.PolygonMainnet,
    `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  )!,
  AVALANCHE: createViemPublicClientForChain(ChainId['AvalancheC-Chain'], 'https://api.avax.network/ext/bc/C/rpc')!,
} as const;

export const getSpenderData = async (
  address: Address,
  chainId: number,
): Promise<Nullable<SpenderData | SpenderRiskData>> => {
  const source = new AggregateSpenderDataSource({
    aggregationType: AggregationType.PARALLEL_COMBINED,
    sources: [new BackendSpenderDataSource()],
  });

  return source.getSpenderData(address, chainId);
};

export const lookupEnsName = async (address?: Address): Promise<string | null> => {
  if (!address) return null;

  try {
    const name = await GlobalClients.ETHEREUM?.getEnsName({ address });
    return name ?? null;
  } catch {
    return null;
  }
};

export const resolveEnsName = async (name?: string): Promise<Address | null> => {
  if (!name) return null;

  try {
    const address = await GlobalClients.ETHEREUM?.getEnsAddress({ name: normalize(name) });
    return address ?? null;
  } catch {
    return null;
  }
};

export const lookupUnsName = async (address?: Address): Promise<string | null> => {
  if (!address) return null;

  const lookupUnsNameOnClient = (client: PublicClient, contractAddress: Address) =>
    client.readContract({
      abi: UNSTOPPABLE_DOMAINS_ABI,
      address: contractAddress,
      functionName: 'reverseNameOf',
      args: [address],
    });

  try {
    const results = await Promise.allSettled([
      lookupUnsNameOnClient(GlobalClients.ETHEREUM, UNSTOPPABLE_DOMAINS_ETH_ADDRESS),
      lookupUnsNameOnClient(GlobalClients.POLYGON, UNSTOPPABLE_DOMAINS_POLYGON_ADDRESS),
    ]);

    for (const result of results) {
      if (result?.status === 'fulfilled' && result.value) return result.value.toLowerCase();
    }

    return null;
  } catch {
    return null;
  }
};

export const resolveUnsName = async (unsName?: string): Promise<Address | null> => {
  if (!unsName) return null;

  const resolveUnsNameOnClient = (client: PublicClient, contractAddress: Address) =>
    client.readContract({
      abi: UNSTOPPABLE_DOMAINS_ABI,
      address: contractAddress,
      functionName: 'getMany',
      args: [['crypto.ETH.address'], BigInt(namehash(unsName))],
    });

  try {
    const results = await Promise.allSettled([
      resolveUnsNameOnClient(GlobalClients.ETHEREUM, UNSTOPPABLE_DOMAINS_ETH_ADDRESS).then((result) => result?.[0]),
      resolveUnsNameOnClient(GlobalClients.POLYGON, UNSTOPPABLE_DOMAINS_POLYGON_ADDRESS).then((result) => result?.[0]),
    ]);

    for (const result of results) {
      if (result?.status === 'fulfilled' && result.value) return getAddress(result.value.toLowerCase());
    }

    return null;
  } catch {
    return null;
  }
};

export const lookupAvvyName = async (address?: Address): Promise<Nullable<string>> => {
  if (!address) return null;

  try {
    const name = await GlobalClients.AVALANCHE.readContract({
      abi: AVVY_DOMAINS_ABI,
      address: AVVY_DOMAINS_ADDRESS,
      functionName: 'reverseResolveEVMToName',
      args: [address],
    });

    return name || null;
  } catch {
    return null;
  }
};

export const resolveAvvyName = async (avvyName?: string): Promise<Address | null> => {
  if (!avvyName) return null;

  try {
    const address = await GlobalClients.AVALANCHE.readContract({
      abi: AVVY_DOMAINS_ABI,
      address: AVVY_DOMAINS_ADDRESS,
      functionName: 'resolveStandard',
      args: [avvyName, 3n],
    });

    return getAddress(address?.toLowerCase()) || null;
  } catch {
    return null;
  }
};

// Note that we don't wait for the UNS name to resolve before returning the ENS name
export const lookupDomainName = async (address: Address) => {
  try {
    const unsNamePromise = lookupUnsName(address);
    const avvyNamePromise = lookupAvvyName(address);
    const ensName = await lookupEnsName(address);
    return ensName ?? (await unsNamePromise) ?? (await avvyNamePromise);
  } catch {
    return null;
  }
};

export const parseInputAddress = async (inputAddressOrName: string): Promise<Address | null> => {
  const sanitisedInput = inputAddressOrName.trim().toLowerCase();
  const parts = sanitisedInput.split('.');
  const tld = parts.length > 1 ? parts.pop() : null;

  if (tld) {
    // Avvy Domains
    if (tld === 'avax') return resolveAvvyName(sanitisedInput);
    // Unstoppable Domains
    if (UNSTOPPABLE_TLDS.includes(tld)) return resolveUnsName(sanitisedInput);
    // Treat anything else as a potential ENS name, which include .eth and all DNS domains
    return resolveEnsName(sanitisedInput);
  }

  // If the input is a valid address, return it
  if (isAddress(sanitisedInput)) return getAddress(sanitisedInput);

  // If the input is not a valid address, return null
  return null;
};

export const getAddressAndDomainName = async (addressOrName: string) => {
  const address = await parseInputAddress(addressOrName.toLowerCase());
  const isName = addressOrName.toLowerCase() !== address?.toLowerCase();
  const domainName = isName ? addressOrName : await lookupDomainName(address);

  return { address, domainName };
};
