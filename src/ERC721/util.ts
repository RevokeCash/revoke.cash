import { Contract, providers } from 'ethers'
import { providers as multicall } from '@0xsequence/multicall'
import { getAddress } from 'ethers/lib/utils'
import { ERC721Metadata, OPENSEA_REGISTRY } from '../common/abis'
import { ADDRESS_ZERO, DUMMY_ADDRESS, DUMMY_ADDRESS_2, OPENSEA_REGISTRY_ADDRESS } from '../common/constants'
import { TokenMapping } from '../common/interfaces'
import { addressToAppName as addressToAppNameBase, unpackResult, withFallback } from '../common/util'

export async function getTokenData(contract: Contract, ownerAddress: string, tokenMapping: TokenMapping = {}) {
  const tokenData = tokenMapping[getAddress(contract.address)]

  const multicallContract = new Contract(contract.address, ERC721Metadata, new multicall.MulticallProvider(contract.provider))
  const [balance, symbol] = await Promise.all([
    unpackResult(multicallContract.functions.balanceOf(ownerAddress)),
    // Use the tokenlist name if present, fall back to '???' since not every NFT has a name
    tokenData?.name ?? withFallback(unpackResult(multicallContract.functions.name()), '???'),
    throwIfNotErc721(multicallContract),
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

  console.log(contract.address, isApprovedForAll)

  // The only acceptable value for checking whether 0x00...01 has an allowance set to 0x00...02 is false
  // This could happen when the contract is not ERC721 but does have a fallback function
  if (isApprovedForAll !== false) {
    throw new Error('Response to isApprovedForAll was not false, indicating that this is not an ERC721 contract')
  }
}
