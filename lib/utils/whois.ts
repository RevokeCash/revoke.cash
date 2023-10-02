import { ChainId } from '@revoke.cash/chains';
import axios from 'axios';
import { AVVY_DOMAINS_ABI, OPENSEA_REGISTRY_ABI, UNSTOPPABLE_DOMAINS_ABI } from 'lib/abis';
import {
  ADDRESS_ZERO,
  ALCHEMY_API_KEY,
  AVVY_DOMAINS_ADDRESS,
  OPENSEA_REGISTRY_ADDRESS,
  UNSTOPPABLE_DOMAINS_ETH_ADDRESS,
  UNSTOPPABLE_DOMAINS_POLYGON_ADDRESS,
  WHOIS_BASE_URL,
} from 'lib/constants';
import { SpenderData } from 'lib/interfaces';
import { Address, PublicClient, getAddress, isAddress, namehash } from 'viem';
import { createViemPublicClientForChain } from './chains';

// Note that we do not use the official UD or Avvy resolution libraries below because they are big and use Ethers.js

const GlobalClients = {
  ETHEREUM: createViemPublicClientForChain(
    ChainId.EthereumMainnet,
    `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  ),
  POLYGON: createViemPublicClientForChain(
    ChainId.PolygonMainnet,
    `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
  ),
  AVALANCHE: createViemPublicClientForChain(ChainId['AvalancheC-Chain'], 'https://api.avax.network/ext/bc/C/rpc'),
};

export const getSpenderData = async (
  address: string,
  chainId?: number,
  openseaProxyAddress?: string,
): Promise<SpenderData | null> => {
  if (!chainId) return null;
  if (!address) return null;
  if (address === openseaProxyAddress) return { name: 'OpenSea (old)' };

  // Check Harpie only if the whois doesn't have a name, because this is a rate-limited API
  const data = (await getSpenderDataFromWhois(address, chainId)) ?? (await getSpenderDataFromHarpie(address, chainId));

  return data;
};

const getSpenderDataFromWhois = async (address: string, chainId: number): Promise<SpenderData | null> => {
  try {
    const { data } = await axios.get(`${WHOIS_BASE_URL}/spenders/${chainId}/${getAddress(address)}.json`);
    return data;
  } catch {
    return null;
  }
};

const getSpenderDataFromHarpie = async (address: string, chainId: number): Promise<SpenderData | null> => {
  const apiKey = process.env.NEXT_PUBLIC_HARPIE_API_KEY;
  if (!apiKey || chainId !== 1) return null;

  try {
    const { data } = await axios.post('https://api.harpie.io/getprotocolfromcontract', { apiKey, address });
    if (!data?.contractOwner || data?.contractOwner === 'NO_DATA') return null;
    return { name: data.contractOwner };
  } catch (e) {
    return null;
  }
};

export const lookupEnsName = async (address: Address): Promise<string | null> => {
  try {
    const name = await GlobalClients.ETHEREUM?.getEnsName({ address });
    return name ?? null;
  } catch {
    return null;
  }
};

export const resolveEnsName = async (name: string): Promise<Address | null> => {
  try {
    const address = await GlobalClients.ETHEREUM?.getEnsAddress({ name: name.toLowerCase() });
    return address ?? null;
  } catch {
    return null;
  }
};

export const lookupUnsName = async (address: Address) => {
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

export const resolveUnsName = async (unsName: string): Promise<Address | null> => {
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

export const lookupAvvyName = async (address: Address) => {
  try {
    const name = await GlobalClients.AVALANCHE.readContract({
      abi: AVVY_DOMAINS_ABI,
      address: AVVY_DOMAINS_ADDRESS,
      functionName: 'reverseResolveEVMToName',
      args: [address],
    });

    return name || null;
  } catch (err) {
    return null;
  }
};

export const resolveAvvyName = async (avvyName: string): Promise<Address | null> => {
  try {
    const address = await GlobalClients.AVALANCHE.readContract({
      abi: AVVY_DOMAINS_ABI,
      address: AVVY_DOMAINS_ADDRESS,
      functionName: 'resolveStandard',
      args: [avvyName, 3n],
    });

    return getAddress(address?.toLowerCase()) || null;
  } catch (err) {
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

export const getOpenSeaProxyAddress = async (userAddress: Address): Promise<Address | null> => {
  try {
    const proxyAddress = await GlobalClients.ETHEREUM.readContract({
      address: OPENSEA_REGISTRY_ADDRESS,
      abi: OPENSEA_REGISTRY_ABI,
      functionName: 'proxies',
      args: [userAddress],
    });

    if (!proxyAddress || proxyAddress === ADDRESS_ZERO) return null;
    return proxyAddress;
  } catch {
    return null;
  }
};

export const parseInputAddress = async (inputAddressOrName: string): Promise<Address | undefined> => {
  const sanitisedInput = inputAddressOrName.trim().toLowerCase();

  // We support ENS .eth and Avvy .avax domains, other domain-like inputs are interpreted as Unstoppable Domains
  if (sanitisedInput.endsWith('.eth')) return resolveEnsName(sanitisedInput);
  if (sanitisedInput.endsWith('.avax')) return resolveAvvyName(sanitisedInput);
  if (sanitisedInput.includes('.')) return resolveUnsName(sanitisedInput);
  if (isAddress(sanitisedInput)) return getAddress(sanitisedInput);

  return undefined;
};
