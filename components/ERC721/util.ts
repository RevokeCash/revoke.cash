import { BigNumber, Contract, providers } from 'ethers'
import { getAddress, hexDataSlice } from 'ethers/lib/utils'
import { OPENSEA_REGISTRY } from '../common/abis'
import { ADDRESS_ZERO, DUMMY_ADDRESS, DUMMY_ADDRESS_2, OPENSEA_REGISTRY_ADDRESS } from '../common/constants'
import { TokenMapping } from '../common/interfaces'
import { Allowance } from './interfaces'
import { addressToAppName as addressToAppNameBase, convertString, getDappListName, lookupEnsName, shortenAddress, unpackResult, withFallback } from '../common/util'

export async function getLimitedAllowancesFromApprovals(contract: Contract, approvals: providers.Log[]) {
  const deduplicatedApprovals = approvals
    .filter((approval, i) => i === approvals.findIndex(other => approval.topics[2] === other.topics[2]))

  const allowances: Allowance[] = await Promise.all(
    deduplicatedApprovals.map((approval) => getLimitedAllowanceFromApproval(contract, approval))
  )

  return allowances
}

async function getLimitedAllowanceFromApproval(multicallContract: Contract, approval: providers.Log) {
  // Wrap this in a try-catch since it's possible the NFT has been burned
  try {
    // Some contracts (like CryptoStrikers) may not implement ERC721 correctly
    // by making tokenId a non-indexed parameter, in which case it needs to be
    // taken from the event data rather than topics
    const tokenId = approval.topics.length === 4
      ? BigNumber.from(approval.topics[3]).toString()
      : BigNumber.from(approval.data).toString()

    const [spender] = await multicallContract.functions.getApproved(tokenId)
    if (spender === ADDRESS_ZERO) return undefined

    return { spender, tokenId }
  } catch {
    return undefined
  }
}

export async function getUnlimitedAllowancesFromApprovals(contract: Contract, ownerAddress: string, approvals: providers.Log[]) {
  const deduplicatedApprovals = approvals
    .filter((approval, i) => i === approvals.findIndex(other => approval.topics[2] === other.topics[2]))

  const allowances: Allowance[] = await Promise.all(
    deduplicatedApprovals.map((approval) => getUnlimitedAllowanceFromApproval(contract, ownerAddress, approval))
  )

  return allowances
}

async function getUnlimitedAllowanceFromApproval(multicallContract: Contract, ownerAddress: string, approval: providers.Log) {
  const spender = getAddress(hexDataSlice(approval.topics[2], 12))

  const [isApprovedForAll] = await multicallContract.functions.isApprovedForAll(ownerAddress, spender)
  if (!isApprovedForAll) return undefined

  return { spender }
}

export async function addDisplayAddressesToAllowances(allowances: Allowance[], provider: providers.Provider, chainId: number, openSeaProxyAddress?: string) {
  return await Promise.all(
    allowances.map((allowance) => addDisplayAddresses(allowance, provider, chainId, openSeaProxyAddress))
  )
}

// TODO: Make this multicall-compatible
async function addDisplayAddresses(allowance: Allowance, provider: providers.Provider, chainId: number, openSeaProxyAddress?: string) {
  const ensSpender = await lookupEnsName(allowance.spender, provider)
  const dappListNetworkName = getDappListName(chainId)
  const spenderAppName = await addressToAppName(allowance.spender, dappListNetworkName, openSeaProxyAddress)

  return { ...allowance, ensSpender, spenderAppName }
}

export async function getTokenData(contract: Contract, ownerAddress: string, tokenMapping: TokenMapping = {}) {
  const tokenData = tokenMapping[getAddress(contract.address)]

  const [balance, symbol] = await Promise.all([
    withFallback(convertString(unpackResult(contract.functions.balanceOf(ownerAddress))), 'ERC1155'),
    // Use the tokenlist name if present, fall back to '???' since not every NFT has a name
    tokenData?.name ?? withFallback(unpackResult(contract.functions.name()), shortenAddress(contract.address)),
    throwIfNotErc721(contract),
  ])

  return { symbol, balance }
}

export async function addressToAppName(address: string, networkName?: string, openseaProxyAddress?: string): Promise<string | undefined> {
  if (address === openseaProxyAddress) return 'OpenSea'
  return addressToAppNameBase(address, networkName)
}

export async function getOpenSeaProxyAddress(userAddress: string, provider: providers.Provider): Promise<string | undefined> {
  try {
    const contract = new Contract(OPENSEA_REGISTRY_ADDRESS, OPENSEA_REGISTRY, provider)
    const [proxyAddress] = await contract.functions.proxies(userAddress)
    if (!proxyAddress || proxyAddress === ADDRESS_ZERO) return undefined
    return proxyAddress
  } catch {
    return undefined
  }
}

async function throwIfNotErc721(contract: Contract) {
  // If the function isApprovedForAll does not exist it will throw (and is not ERC721)
  const [isApprovedForAll] = await contract.functions.isApprovedForAll(DUMMY_ADDRESS, DUMMY_ADDRESS_2)

  // The only acceptable value for checking whether 0x00...01 has an allowance set to 0x00...02 is false
  // This could happen when the contract is not ERC721 but does have a fallback function
  if (isApprovedForAll !== false) {
    throw new Error('Response to isApprovedForAll was not false, indicating that this is not an ERC721 contract')
  }
}

export function formatAllowance(tokenId?: string) {
  if (!tokenId) return 'Unlimited allowance'
  return `Allowance for token ID ${tokenId}`
}
