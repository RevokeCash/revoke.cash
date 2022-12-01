import type { Log } from '@ethersproject/abstract-provider';
import type { Contract, providers } from 'ethers';
import { BigNumber, utils } from 'ethers';
import { ADDRESS_ZERO, MOONBIRDS_ADDRESS } from 'lib/constants';
import type { AllowanceData, BaseTokenData, ITokenAllowance, TokenData, TokenMapping } from 'lib/interfaces';
import {
  IERC20Allowance,
  IERC721Allowance,
  isERC20Allowance,
  isERC20Token,
  isERC721Allowance,
  isERC721Token,
} from 'lib/interfaces';
import { toFloat, topicToAddress } from '.';
import { convertString, unpackResult } from './promises';
import { createTokenContracts, getTokenData, isErc721Contract } from './tokens';

export const getAllowancesForAddress = async (
  userAddress: string,
  transferEvents: Log[],
  approvalEvents: Log[],
  approvalForAllEvents: Log[],
  readProvider: providers.Provider,
  tokenMapping: TokenMapping
): Promise<AllowanceData[]> => {
  const allEvents = [...transferEvents, ...approvalEvents, ...approvalForAllEvents];
  const contracts = createTokenContracts(allEvents, readProvider);

  // Look up token data for all tokens, add their lists of approvals
  const allowances = await Promise.all(
    contracts.map(async (contract) => {
      const approvalsForAll = approvalForAllEvents.filter((approval) => approval.address === contract.address);
      const approvals = approvalEvents.filter((approval) => approval.address === contract.address);

      try {
        const tokenData: BaseTokenData = await getTokenData(contract, userAddress, tokenMapping);
        const allowances = await getAllowancesForToken(contract, approvals, approvalsForAll, userAddress, tokenData);

        if (allowances.length === 0) {
          return [mergeAllowanceAndToken(contract, tokenData)];
        }

        const fullAllowances = allowances.map((allowance) => mergeAllowanceAndToken(contract, tokenData, allowance));
        return fullAllowances;
      } catch (e) {
        console.error(e);
        // If the call to getTokenData() fails, the token is not a standard-adhering token so
        // we do not include it in the token list.
        return [];
      }
    })
  );

  return allowances.flat();
};

export const getAllowancesForToken = async (
  contract: Contract,
  approvalEvents: Log[],
  approvalForAllEvents: Log[],
  userAddress: string,
  tokenData: BaseTokenData
): Promise<Array<IERC20Allowance | IERC721Allowance>> => {
  if (isErc721Contract(contract)) {
    const unlimitedAllowances = await getUnlimitedErc721AllowancesFromApprovals(
      contract,
      userAddress,
      approvalForAllEvents
    );
    const limitedAllowances = await getLimitedErc721AllowancesFromApprovals(contract, approvalEvents);

    const allowances = [...limitedAllowances, ...unlimitedAllowances].filter((allowance) => !!allowance);

    return allowances;
  } else {
    // Filter out zero-value allowances
    const allowances = (await getErc20AllowancesFromApprovals(contract, userAddress, approvalEvents)).filter(
      ({ amount }) => formatErc20Allowance(amount, tokenData?.decimals, tokenData?.totalSupply) !== '0.000'
    );

    return allowances;
  }
};

const mergeAllowanceAndToken = (
  contract: Contract,
  tokenData: BaseTokenData,
  allowance?: IERC20Allowance | IERC721Allowance
): AllowanceData => ({
  ...tokenData,
  contract,
  spender: allowance?.spender,
  amount: allowance && isERC20Allowance(allowance) ? allowance?.amount : undefined,
  tokenId: allowance && isERC721Allowance(allowance) ? allowance?.tokenId : undefined,
});

export const getErc20AllowancesFromApprovals = async (contract: Contract, ownerAddress: string, approvals: Log[]) => {
  const deduplicatedApprovals = approvals.filter(
    (approval, i) => i === approvals.findIndex((other) => approval.topics[2] === other.topics[2])
  );

  const allowances: IERC20Allowance[] = await Promise.all(
    deduplicatedApprovals.map((approval) => getErc20AllowanceFromApproval(contract, ownerAddress, approval))
  );

  return allowances;
};

const getErc20AllowanceFromApproval = async (multicallContract: Contract, ownerAddress: string, approval: Log) => {
  const spender = topicToAddress(approval.topics[2]);
  const amount = await convertString(unpackResult(multicallContract.functions.allowance(ownerAddress, spender)));

  return { spender, amount };
};

export const getLimitedErc721AllowancesFromApprovals = async (contract: Contract, approvals: Log[]) => {
  const deduplicatedApprovals = approvals.filter(
    (approval, i) => i === approvals.findIndex((other) => approval.topics[2] === other.topics[2])
  );

  const allowances: IERC721Allowance[] = await Promise.all(
    deduplicatedApprovals.map((approval) => getLimitedErc721AllowanceFromApproval(contract, approval))
  );

  return allowances;
};

const getLimitedErc721AllowanceFromApproval = async (multicallContract: Contract, approval: Log) => {
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
};

export const getUnlimitedErc721AllowancesFromApprovals = async (
  contract: Contract,
  ownerAddress: string,
  approvals: Log[]
) => {
  const deduplicatedApprovals = approvals.filter(
    (approval, i) => i === approvals.findIndex((other) => approval.topics[2] === other.topics[2])
  );

  const allowances: IERC721Allowance[] = await Promise.all(
    deduplicatedApprovals.map((approval) => getUnlimitedErc721AllowanceFromApproval(contract, ownerAddress, approval))
  );

  return allowances;
};

const getUnlimitedErc721AllowanceFromApproval = async (
  multicallContract: Contract,
  ownerAddress: string,
  approval: Log
) => {
  const spender = topicToAddress(approval.topics[2]);

  const [isApprovedForAll] = await multicallContract.functions.isApprovedForAll(ownerAddress, spender);
  if (!isApprovedForAll) return undefined;

  return { spender };
};

export const formatErc20Allowance = (allowance: string, decimals: number, totalSupply: string): string => {
  const allowanceBN = BigNumber.from(allowance);
  const totalSupplyBN = BigNumber.from(totalSupply);

  if (allowanceBN.gt(totalSupplyBN)) {
    return 'Unlimited';
  }

  return toFloat(Number(allowanceBN), decimals);
};

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
export const generatePatchedAllowanceEvents = (
  userAddress: string,
  openseaProxyAddress?: string,
  allEvents: Log[] = []
): Log[] => {
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
};
