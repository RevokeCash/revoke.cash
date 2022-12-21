import axios from 'axios';
import { Contract, utils } from 'ethers';
import { OPENSEA_REGISTRY } from 'lib/abis';
import {
  ADDRESS_ZERO,
  ALCHEMY_PROVIDER,
  DAPP_LIST_BASE_URL,
  ENS_RESOLUTION,
  ETHEREUM_LISTS_CONTRACTS,
  OPENSEA_REGISTRY_ADDRESS,
  UNS_RESOLUTION,
} from 'lib/constants';

export const addressToAppName = async (
  address: string,
  chainId?: number,
  openseaProxyAddress?: string
): Promise<string | null> => {
  if (!chainId) return null;
  if (!address) return null;
  if (address === openseaProxyAddress) return 'OpenSea (old)';
  const name = (await getNameFromDappList(address, chainId)) ?? (await getNameFromEthereumList(address, chainId));
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

// Note that we don't wait for the UNS name to resolve before returning the ENS name
export const lookupDomainName = async (address: string) => {
  try {
    const unsNamePromise = lookupUnsName(address);
    const ensName = await lookupEnsName(address);
    return ensName ?? (await unsNamePromise);
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
