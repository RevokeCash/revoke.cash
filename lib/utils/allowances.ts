import { BigNumber, Contract, providers, utils } from 'ethers';
import { ADDRESS_ZERO, MOONBIRDS_ADDRESS } from 'lib/constants';
import {
  IERC20Allowance,
  IERC721Allowance,
  isERC20Allowance,
  isERC20Token,
  isERC721Allowance,
  isERC721Token,
  ITokenAllowance,
  TokenData,
} from 'lib/interfaces';
import { toFloat, topicToAddress } from '.';
import { convertString, unpackResult } from './promises';

export async function getErc20AllowancesFromApprovals(
  contract: Contract,
  ownerAddress: string,
  approvals: providers.Log[]
) {
  const deduplicatedApprovals = approvals.filter(
    (approval, i) => i === approvals.findIndex((other) => approval.topics[2] === other.topics[2])
  );

  const allowances: IERC20Allowance[] = await Promise.all(
    deduplicatedApprovals.map((approval) => getErc20AllowanceFromApproval(contract, ownerAddress, approval))
  );

  return allowances;
}

async function getErc20AllowanceFromApproval(
  multicallContract: Contract,
  ownerAddress: string,
  approval: providers.Log
) {
  const spender = topicToAddress(approval.topics[2]);
  const amount = await convertString(unpackResult(multicallContract.functions.allowance(ownerAddress, spender)));

  return { spender, amount };
}

export async function getLimitedErc721AllowancesFromApprovals(contract: Contract, approvals: providers.Log[]) {
  const deduplicatedApprovals = approvals.filter(
    (approval, i) => i === approvals.findIndex((other) => approval.topics[2] === other.topics[2])
  );

  const allowances: IERC721Allowance[] = await Promise.all(
    deduplicatedApprovals.map((approval) => getLimitedErc721AllowanceFromApproval(contract, approval))
  );

  return allowances;
}

async function getLimitedErc721AllowanceFromApproval(multicallContract: Contract, approval: providers.Log) {
  // Wrap this in a try-catch since it's possible the NFT has been burned
  try {
    // Some contracts (like CryptoStrikers) may not implement ERC721 correctly
    // by making tokenId a non-indexed parameter, in which case it needs to be
    // taken from the event data rather than topics
    const tokenId =
      approval.topics.length === 4
        ? BigNumber.from(approval.topics[3]).toString()
        : BigNumber.from(approval.data).toString();

    const [owner, spender] = await Promise.all([
      unpackResult(multicallContract.functions.ownerOf(tokenId)),
      unpackResult(multicallContract.functions.getApproved(tokenId)),
    ]);

    const expectedOwner = topicToAddress(approval.topics[1]);
    if (spender === ADDRESS_ZERO || owner !== expectedOwner) return undefined;

    return { spender, tokenId };
  } catch {
    return undefined;
  }
}

export async function getUnlimitedErc721AllowancesFromApprovals(
  contract: Contract,
  ownerAddress: string,
  approvals: providers.Log[]
) {
  const deduplicatedApprovals = approvals.filter(
    (approval, i) => i === approvals.findIndex((other) => approval.topics[2] === other.topics[2])
  );

  const allowances: IERC721Allowance[] = await Promise.all(
    deduplicatedApprovals.map((approval) => getUnlimitedErc721AllowanceFromApproval(contract, ownerAddress, approval))
  );

  return allowances;
}

async function getUnlimitedErc721AllowanceFromApproval(
  multicallContract: Contract,
  ownerAddress: string,
  approval: providers.Log
) {
  const spender = topicToAddress(approval.topics[2]);

  const [isApprovedForAll] = await multicallContract.functions.isApprovedForAll(ownerAddress, spender);
  if (!isApprovedForAll) return undefined;

  return { spender };
}

export function formatErc20Allowance(allowance: string, decimals: number, totalSupply: string): string {
  const allowanceBN = BigNumber.from(allowance);
  const totalSupplyBN = BigNumber.from(totalSupply);

  if (allowanceBN.gt(totalSupplyBN)) {
    return 'Unlimited';
  }

  return toFloat(Number(allowanceBN), decimals);
}

export const getAllowanceI18nValues = (allowance: ITokenAllowance, token: TokenData, updatedAmount?: string) => {
  if (isERC20Allowance(allowance) && isERC20Token(token)) {
    const amount = formatErc20Allowance(updatedAmount ?? allowance.amount, token.decimals, token.totalSupply);
    const i18nKey = amount === 'Unlimited' ? 'dashboard:allowance_unlimited' : 'dashboard:allowance';
    return { amount, i18nKey };
  } else if (isERC721Allowance(allowance) && isERC721Token(token)) {
    const { tokenId } = allowance;
    const i18nKey = tokenId === undefined ? 'dashboard:allowance_unlimited' : 'dashboard:allowance_token_id';
    return { tokenId, i18nKey };
  } else {
    throw new Error('Mismatching token + allowance types');
  }
};

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
