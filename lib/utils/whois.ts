import { ChainId } from '@revoke.cash/chains';
import { AVVY_DOMAINS_ABI, OPENSEA_REGISTRY_ABI, UNSTOPPABLE_DOMAINS_ABI } from 'lib/abis';
import {
  ADDRESS_ZERO,
  ALCHEMY_API_KEY,
  AVVY_DOMAINS_ADDRESS,
  HARPIE_API_KEY,
  OPENSEA_REGISTRY_ADDRESS,
  UNSTOPPABLE_DOMAINS_ETH_ADDRESS,
  UNSTOPPABLE_DOMAINS_POLYGON_ADDRESS,
  WEBACY_API_KEY,
  WHOIS_BASE_URL,
} from 'lib/constants';
import { SpenderData, SpenderRiskData } from 'lib/interfaces';
import ky from 'lib/ky';
import md5 from 'md5';
import { Address, PublicClient, getAddress, isAddress, namehash } from 'viem';
import { deduplicateArray } from '.';
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

export const getSpenderDataFromBackend = async (
  address: Address,
  chainId: number,
  openseaProxyAddress?: string,
): Promise<SpenderData | null> => {
  if (address === openseaProxyAddress) return { name: 'OpenSea (old)' };

  const spenderData = await ky.get(`/api/${chainId}/spender/${getAddress(address)}`).json<SpenderData>();
  return spenderData;
};

export const getSpenderData = async (
  address: string,
  chainId?: number,
  openseaProxyAddress?: string,
): Promise<SpenderData | null> => {
  const [labelData, riskData] = await Promise.all([
    getLabelData(address, chainId, openseaProxyAddress),
    getRiskData(address, chainId),
  ]);

  return { ...labelData, ...riskData };
};

export const getLabelData = async (
  address: string,
  chainId?: number,
  openseaProxyAddress?: string,
): Promise<SpenderData | null> => {
  if (!chainId) return null;
  if (!address) return null;
  if (address === openseaProxyAddress) return { name: 'OpenSea (old)' };

  // Check Harpie only if the whois doesn't have a name, because this is a rate-limited API
  const data = (await getLabelDataFromWhois(address, chainId)) ?? (await getLabelDataFromHarpie(address, chainId));

  return data;
};

const getLabelDataFromWhois = async (address: string, chainId: number): Promise<SpenderData | null> => {
  try {
    const labelData = await ky
      .get(`${WHOIS_BASE_URL}/spenders/${chainId}/${getAddress(address)}.json`)
      .json<SpenderData>();
    if (!labelData || Object.keys(labelData).length === 0) return null;
    return labelData;
  } catch {
    return null;
  }
};

const getLabelDataFromHarpie = async (address: string, chainId: number): Promise<SpenderData | null> => {
  const apiKey = HARPIE_API_KEY;
  if (!apiKey || chainId !== 1) return null;

  try {
    const data = await ky
      .post('https://api.harpie.io/getprotocolfromcontract', {
        json: { apiKey, address },
      })
      .json<any>();

    if (!data?.contractOwner || data?.contractOwner === 'NO_DATA') return null;
    return { name: data.contractOwner };
  } catch (e) {
    return null;
  }
};

const getRiskData = async (address: string, chainId: number): Promise<SpenderRiskData | null> => {
  const results = await Promise.all([
    getRiskDataFromScamSniffer(address, chainId),
    getRiskDataFromWebacy(address, chainId),
    // getRiskDataFromHarpie(address, chainId),
  ]);

  return results.reduce(
    (acc, result) =>
      result
        ? { ...acc, ...(result ?? {}), riskFactors: [...(acc?.riskFactors ?? []), ...(result?.riskFactors ?? [])] }
        : acc,
    {},
  );
};

const getRiskDataFromScamSniffer = async (address: string, _chainId: number): Promise<SpenderRiskData | null> => {
  const identifier = md5(`revokecash:${address.toLowerCase()}`);

  try {
    const time = new Date().getTime();
    const riskData = await ky.get(`${WHOIS_BASE_URL}/spenders/scamsniffer/${identifier}.json`).json<SpenderData>();
    const elapsedTime = (new Date().getTime() - time) / 1000;

    console.log(elapsedTime, 'ScamSniffer', address);

    return riskData;
    // return null;
  } catch {
    return null;
  }
};

const getRiskDataFromWebacy = async (address: string, chainId: number): Promise<SpenderRiskData | null> => {
  const chainIdentifiers = {
    1: 'eth',
  };

  const chainIdentifier = chainIdentifiers[chainId];
  if (!chainIdentifier || !WEBACY_API_KEY) return null;

  try {
    const time = new Date().getTime();
    const webacyData = await ky
      .get(`https://api.webacy.com/addresses/${address}?chain=${chainIdentifier}`, {
        headers: { 'x-api-key': WEBACY_API_KEY },
      })
      .json<any>();

    const elapsedTime = (new Date().getTime() - time) / 1000;
    console.log(elapsedTime, 'Webacy', address);

    const riskFactors = (webacyData?.issues ?? []).flatMap((issue) => {
      const tags = issue?.tags?.map((tag: any) => tag.key);
      const categories = Object.keys(issue?.categories);
      // console.log(issue)
      if (categories.includes('fraudulent_malicious')) return 'blocklist_webacy';
      if (categories.includes('possible_drainer')) return 'blocklist_webacy';
      return [...tags, ...categories];
    });
    if (webacyData?.isContract === false) riskFactors.push('eoa');
    return { riskFactors: deduplicateArray(riskFactors) };
  } catch {
    return null;
  }
};

const getRiskDataFromHarpie = async (address: string, chainId: number): Promise<SpenderRiskData | null> => {
  const apiKey = HARPIE_API_KEY;
  if (!apiKey || chainId !== 1) return null;

  try {
    const time = new Date().getTime();

    const res = await fetch('https://api.harpie.io/v2/validateAddress', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey, address }),
    });

    const data = await res.json();
    const riskFactors = data.isMaliciousAddress ? ['blocklist_harpie'] : [];

    // const { name, isMaliciousAddress } = await ky
    //   .post('https://api.harpie.io/v2/validateAddress', {
    //     method: 'POST',
    //     json: { apiKey, address },
    //   })
    //   .json<any>();

    const elapsedTime = (new Date().getTime() - time) / 1000;
    console.log(elapsedTime, 'Harpie', address);

    return { riskFactors };
  } catch (e) {
    console.error('Err', e);
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

export const getAddressAndDomainName = async (addressOrName: string) => {
  const address = await parseInputAddress(addressOrName.toLowerCase());
  const isName = addressOrName.toLowerCase() !== address?.toLowerCase();
  const domainName = isName ? addressOrName : await lookupDomainName(address);

  return { address, domainName };
};
