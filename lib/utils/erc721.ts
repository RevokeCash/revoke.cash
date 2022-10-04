import { BigNumber, Contract, providers, utils } from 'ethers';
import { getAddress, hexDataSlice } from 'ethers/lib/utils';
import { OPENSEA_REGISTRY } from 'lib/abis';
import {
  ADDRESS_ZERO,
  DUMMY_ADDRESS,
  DUMMY_ADDRESS_2,
  MOONBIRDS_ADDRESS,
  OPENSEA_REGISTRY_ADDRESS,
} from 'lib/constants';
import { IERC721Allowance, TokenMapping } from 'lib/interfaces';
import { shortenAddress } from '.';
import { convertString, unpackResult, withFallback } from './promises';

export async function getLimitedAllowancesFromApprovals(contract: Contract, approvals: providers.Log[]) {
  const deduplicatedApprovals = approvals.filter(
    (approval, i) => i === approvals.findIndex((other) => approval.topics[2] === other.topics[2])
  );

  const allowances: IERC721Allowance[] = await Promise.all(
    deduplicatedApprovals.map((approval) => getLimitedAllowanceFromApproval(contract, approval))
  );

  return allowances;
}

async function getLimitedAllowanceFromApproval(multicallContract: Contract, approval: providers.Log) {
  // Wrap this in a try-catch since it's possible the NFT has been burned
  try {
    // Some contracts (like CryptoStrikers) may not implement ERC721 correctly
    // by making tokenId a non-indexed parameter, in which case it needs to be
    // taken from the event data rather than topics
    const tokenId =
      approval.topics.length === 4
        ? BigNumber.from(approval.topics[3]).toString()
        : BigNumber.from(approval.data).toString();

    const [spender] = await multicallContract.functions.getApproved(tokenId);
    if (spender === ADDRESS_ZERO) return undefined;

    return { spender, tokenId };
  } catch {
    return undefined;
  }
}

export async function getUnlimitedAllowancesFromApprovals(
  contract: Contract,
  ownerAddress: string,
  approvals: providers.Log[]
) {
  const deduplicatedApprovals = approvals.filter(
    (approval, i) => i === approvals.findIndex((other) => approval.topics[2] === other.topics[2])
  );

  const allowances: IERC721Allowance[] = await Promise.all(
    deduplicatedApprovals.map((approval) => getUnlimitedAllowanceFromApproval(contract, ownerAddress, approval))
  );

  return allowances;
}

async function getUnlimitedAllowanceFromApproval(
  multicallContract: Contract,
  ownerAddress: string,
  approval: providers.Log
) {
  const spender = getAddress(hexDataSlice(approval.topics[2], 12));

  const [isApprovedForAll] = await multicallContract.functions.isApprovedForAll(ownerAddress, spender);
  if (!isApprovedForAll) return undefined;

  return { spender };
}

export async function getTokenData(contract: Contract, ownerAddress: string, tokenMapping: TokenMapping = {}) {
  const tokenData = tokenMapping[getAddress(contract.address)];

  const [balance, symbol] = await Promise.all([
    withFallback(convertString(unpackResult(contract.functions.balanceOf(ownerAddress))), 'ERC1155'),
    // Use the tokenlist name if present, fall back to '???' since not every NFT has a name
    tokenData?.name ?? withFallback(unpackResult(contract.functions.name()), shortenAddress(contract.address)),
    throwIfNotErc721(contract),
  ]);

  return { symbol, balance };
}

export async function getOpenSeaProxyAddress(
  userAddress: string,
  provider: providers.Provider
): Promise<string | undefined> {
  try {
    const contract = new Contract(OPENSEA_REGISTRY_ADDRESS, OPENSEA_REGISTRY, provider);
    const [proxyAddress] = await contract.functions.proxies(userAddress);
    if (!proxyAddress || proxyAddress === ADDRESS_ZERO) return undefined;
    return proxyAddress;
  } catch {
    return undefined;
  }
}

// This function is a hardcoded patch to show Moonbirds' OpenSea allowances,
// which do not show up normally because of a bug in their contract
export function generatePatchedAllowanceEvents(
  userAddress: string,
  openseaProxyAddress?: string,
  allEvents: providers.Log[] = []
): providers.Log[] {
  if (!userAddress || !openseaProxyAddress) return [];
  // Only add the Moonbirds approval event if the account has interacted with Moonbirds at all
  if (!allEvents.some((ev) => ev.address === MOONBIRDS_ADDRESS)) return [];

  const baseDummyEventLog = {
    blockNumber: 0,
    blockHash: '0x',
    transactionIndex: 0,
    removed: false,
    data: '0x',
    transactionHash: '0x',
    logIndex: 0,
  };

  return [
    {
      ...baseDummyEventLog,
      address: MOONBIRDS_ADDRESS,
      topics: [
        utils.id('ApprovalForAll(address,address,approved)'),
        utils.hexZeroPad(userAddress, 32),
        utils.hexZeroPad(openseaProxyAddress, 32),
      ],
    },
  ];
}

async function throwIfNotErc721(contract: Contract) {
  // If the function isApprovedForAll does not exist it will throw (and is not ERC721)
  const [isApprovedForAll] = await contract.functions.isApprovedForAll(DUMMY_ADDRESS, DUMMY_ADDRESS_2);

  // The only acceptable value for checking whether 0x00...01 has an allowance set to 0x00...02 is false
  // This could happen when the contract is not ERC721 but does have a fallback function
  if (isApprovedForAll !== false) {
    throw new Error('Response to isApprovedForAll was not false, indicating that this is not an ERC721 contract');
  }
}

export function formatAllowance(tokenId?: string) {
  if (!tokenId) return 'Unlimited allowance';
  return `Allowance for token ID ${tokenId}`;
}
