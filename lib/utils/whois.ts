import AVVY from '@avvy/client';
import { Resolution } from '@unstoppabledomains/resolution';
import axios from 'axios';
import { Contract, providers, utils } from 'ethers';
import { OPENSEA_REGISTRY } from 'lib/abis';
import {
  ADDRESS_ZERO,
  ALCHEMY_PROVIDER,
  DAPP_LIST_BASE_URL,
  ETHEREUM_LISTS_CONTRACTS,
  OPENSEA_REGISTRY_ADDRESS,
} from 'lib/constants';

export const ENS_RESOLUTION = ALCHEMY_PROVIDER;

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

export const AVVY_RESOLUTION = new AVVY(new providers.JsonRpcProvider('https://api.avax.network/ext/bc/C/rpc'));

export const addressToAppName = async (
  address: string,
  chainId?: number,
  openseaProxyAddress?: string
): Promise<string | null> => {
  if (!chainId) return null;
  if (!address) return null;
  if (address === openseaProxyAddress) return 'OpenSea (old)';

  // Request dapplist and ethereumlists in parallel since they're both just GitHub repos
  const dappListPromise = getNameFromDappList(address, chainId);
  const ethereumListsPromise = getNameFromEthereumList(address, chainId);

  // Check Harpie only if the other two sources don't have a name, because this is a rate-limited API
  const name = (await dappListPromise) ?? (await ethereumListsPromise) ?? (await getNameFromHarpie(address, chainId));

  return name;
};

const getNameFromDappList = async (address: string, chainId: number): Promise<string | null> => {
  try {
    const { data } = await axios.get(`${DAPP_LIST_BASE_URL}/${chainId}/${utils.getAddress(address)}.json`);
    return data.appName;
  } catch {
    return null;
  }
};

const getNameFromEthereumList = async (address: string, chainId: number): Promise<string | null> => {
  try {
    const contractRes = await axios.get(
      `${ETHEREUM_LISTS_CONTRACTS}/contracts/${chainId}/${utils.getAddress(address)}.json`
    );

    try {
      const projectRes = await axios.get(`${ETHEREUM_LISTS_CONTRACTS}/projects/${contractRes.data.project}.json`);
      return projectRes.data.name;
    } catch {}

    return contractRes.data.project;
  } catch {
    return null;
  }
};

const getNameFromHarpie = async (address: string, chainId: number): Promise<string | null> => {
  const apiKey = process.env.NEXT_PUBLIC_HARPIE_API_KEY;
  if (!apiKey || chainId !== 1) return null;

  try {
    const { data } = await axios.post('https://api.harpie.io/getprotocolfromcontract', { apiKey, address });
    if (!data?.contractOwner || data?.contractOwner === 'NO_DATA') return null;
    return data.contractOwner;
  } catch (e) {
    return null;
  }
};

export const lookupEnsName = async (address: string): Promise<string | null> => {
  try {
    return await ENS_RESOLUTION?.lookupAddress(address);
  } catch {
    return null;
  }
};

export const resolveEnsName = async (ensName: string): Promise<string | null> => {
  try {
    const address = await ENS_RESOLUTION?.resolveName(ensName);
    return address ? address : null;
  } catch {
    return null;
  }
};

export const lookupUnsName = async (address: string) => {
  try {
    const name = await UNS_RESOLUTION?.reverse(address);
    return name;
  } catch {
    return null;
  }
};

export const resolveUnsName = async (unsName: string) => {
  try {
    const address = await UNS_RESOLUTION?.addr(unsName, 'ETH');
    return utils.getAddress(address?.toLowerCase());
  } catch {
    return null;
  }
};

export const lookupAvvyName = async (address: string) => {
  try {
    const output = await AVVY_RESOLUTION?.batch([address]).reverseToNames(AVVY_RESOLUTION.RECORDS.EVM);
    return output.length === 0 ? null : output[0];
  } catch (err) {
    return null;
  }
};

export const resolveAvvyName = async (avvyName: string) => {
  try {
    return await AVVY_RESOLUTION?.name(avvyName).resolve(AVVY_RESOLUTION.RECORDS.EVM);
  } catch (err) {
    return null;
  }
};

// Note that we don't wait for the UNS name to resolve before returning the ENS name
export const lookupDomainName = async (address: string) => {
  try {
    const unsNamePromise = lookupUnsName(address);
    const avvyNamePromise = lookupAvvyName(address);
    const ensName = await lookupEnsName(address);
    return ensName ?? (await unsNamePromise) ?? (await avvyNamePromise);
  } catch {
    return null;
  }
};

export const getOpenSeaProxyAddress = async (userAddress: string): Promise<string | null> => {
  try {
    const contract = new Contract(OPENSEA_REGISTRY_ADDRESS, OPENSEA_REGISTRY, ALCHEMY_PROVIDER);
    const [proxyAddress] = await contract.functions.proxies(userAddress);
    if (!proxyAddress || proxyAddress === ADDRESS_ZERO) return null;
    return proxyAddress;
  } catch {
    return null;
  }
};
