import { Resolution } from '@unstoppabledomains/resolution';
import axios from 'axios';
import { OPENSEA_REGISTRY_ABI } from 'lib/abis';
import { ADDRESS_ZERO, DATA_BASE_URL, ETHEREUM_LISTS_CONTRACTS, OPENSEA_REGISTRY_ADDRESS } from 'lib/constants';
import { SpenderData } from 'lib/interfaces';
import { Address, getAddress } from 'viem';
import { createViemPublicClientForChain } from './chains';
import AVVY from '@avvy/client';
import { providers } from 'ethers';

export const GLOBAL_ETH_MAINNET_CLIENT = createViemPublicClientForChain(
  1,
  `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
);

export const ENS_RESOLUTION = GLOBAL_ETH_MAINNET_CLIENT;

export const UNS_RESOLUTION =
  process.env.NEXT_PUBLIC_ALCHEMY_API_KEY &&
  new Resolution({
    sourceConfig: {
      uns: {
        locations: {
          Layer1: {
            url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
            network: 'mainnet',
          },
          Layer2: {
            url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
            network: 'polygon-mainnet',
          },
        },
      },
    },
  });

export const AVVY_RESOLUTION = new AVVY(new providers.JsonRpcProvider('https://api.avax.network/ext/bc/C/rpc'), {});

export const getSpenderData = async (
  address: string,
  chainId?: number,
  openseaProxyAddress?: string,
): Promise<SpenderData | null> => {
  if (!chainId) return null;
  if (!address) return null;
  if (address === openseaProxyAddress) return { name: 'OpenSea (old)' };

  // Request dapplist and ethereumlists in parallel since they're both just GitHub repos
  const internalPromise = getSpenderDataFromInternal(address, chainId);
  const ethereumListsPromise = getSpenderDataFromEthereumList(address, chainId);

  // Check Harpie only if the other two sources don't have a name, because this is a rate-limited API
  const data =
    (await internalPromise) ?? (await ethereumListsPromise) ?? (await getSpenderDataFromHarpie(address, chainId));

  return data;
};

const getSpenderDataFromInternal = async (address: string, chainId: number): Promise<SpenderData | null> => {
  try {
    const { data } = await axios.get(`${DATA_BASE_URL}/spenders/${chainId}/${getAddress(address)}.json`);
    return data;
  } catch {
    return null;
  }
};

const getSpenderDataFromEthereumList = async (address: string, chainId: number): Promise<SpenderData | null> => {
  try {
    const contractRes = await axios.get(`${ETHEREUM_LISTS_CONTRACTS}/contracts/${chainId}/${getAddress(address)}.json`);

    try {
      const projectRes = await axios.get(`${ETHEREUM_LISTS_CONTRACTS}/projects/${contractRes.data.project}.json`);
      return { name: projectRes.data.name };
    } catch {}

    return { name: contractRes.data.project };
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
    const name = await ENS_RESOLUTION?.getEnsName({ address });
    return name ?? null;
  } catch {
    return null;
  }
};

export const resolveEnsName = async (name: string): Promise<Address | null> => {
  try {
    const address = await ENS_RESOLUTION?.getEnsAddress({ name: name.toLowerCase() });
    return address ?? null;
  } catch {
    return null;
  }
};

export const lookupUnsName = async (address: Address) => {
  try {
    const name = await UNS_RESOLUTION?.reverse(address);
    return name ?? null;
  } catch {
    return null;
  }
};

export const resolveUnsName = async (unsName: string): Promise<Address | null> => {
  try {
    const address = await UNS_RESOLUTION?.addr(unsName.toLowerCase(), 'ETH');
    return address ? getAddress(address?.toLowerCase()) : null;
  } catch {
    return null;
  }
};

export const lookupAvvyName = async (address: Address) => {
  try {
    const hash = await AVVY_RESOLUTION?.reverse((AVVY.RECORDS as any).EVM, address);
    const { name } = await hash.lookup();
    return name || null;
  } catch (err) {
    return null;
  }
};

export const resolveAvvyName = async (avvyName: string): Promise<Address | null> => {
  try {
    return await AVVY_RESOLUTION?.name(avvyName.toLowerCase()).resolve((AVVY.RECORDS as any).EVM);
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
    const proxyAddress = await GLOBAL_ETH_MAINNET_CLIENT.readContract({
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
  // If the input is an ENS name, validate it, resolve it and return it
  if (inputAddressOrName.endsWith('.eth')) {
    return await resolveEnsName(inputAddressOrName);
  }

  // If the input is an Avvy Domains name..
  if (inputAddressOrName.endsWith('.avax')) {
    return await resolveAvvyName(inputAddressOrName);
  }

  // Other domain-like inputs are interpreted as Unstoppable Domains
  if (inputAddressOrName.includes('.')) {
    return await resolveUnsName(inputAddressOrName);
  }

  // If the input is an address, validate it and return it
  try {
    return getAddress(inputAddressOrName.toLowerCase());
  } catch {
    return undefined;
  }
};
