import axios from 'axios';
import { getAddress } from 'ethers/lib/utils';
import { DAPP_LIST_BASE_URL, ENS_RESOLUTION, ETHEREUM_LISTS_CONTRACTS, UNS_RESOLUTION } from 'lib/constants';

export const addressToAppName = async (
  address: string,
  chainId?: number,
  openseaProxyAddress?: string
): Promise<string | undefined> => {
  if (!chainId) return undefined;
  if (address === openseaProxyAddress) return 'OpenSea (old)';
  const name = (await getNameFromDappList(address, chainId)) ?? (await getNameFromEthereumList(address, chainId));
  return name;
};

const getNameFromDappList = async (address: string, chainId: number): Promise<string | undefined> => {
  try {
    const { data } = await axios.get(`${DAPP_LIST_BASE_URL}/${chainId}/${getAddress(address)}.json`);
    return data.appName;
  } catch {
    return undefined;
  }
};

const getNameFromEthereumList = async (address: string, chainId: number): Promise<string | undefined> => {
  try {
    const contractRes = await axios.get(`${ETHEREUM_LISTS_CONTRACTS}/contracts/${chainId}/${getAddress(address)}.json`);

    try {
      const projectRes = await axios.get(`${ETHEREUM_LISTS_CONTRACTS}/projects/${contractRes.data.project}.json`);
      return projectRes.data.name;
    } catch {}

    return contractRes.data.project;
  } catch {
    return undefined;
  }
};

export async function lookupEnsName(address: string): Promise<string | undefined> {
  try {
    return await ENS_RESOLUTION?.lookupAddress(address);
  } catch {
    return undefined;
  }
}

export async function resolveEnsName(ensName: string): Promise<string | undefined> {
  try {
    const address = await ENS_RESOLUTION?.resolveName(ensName);
    return address ? address : undefined;
  } catch {
    return undefined;
  }
}

export const lookupUnsName = async (address: string) => {
  try {
    const name = await UNS_RESOLUTION?.reverse(address);
    return name;
  } catch {
    return undefined;
  }
};

export const resolveUnsName = async (unsName: string) => {
  try {
    const address = await UNS_RESOLUTION?.addr(unsName, 'ETH');
    return getAddress(address?.toLowerCase());
  } catch {
    return undefined;
  }
};
