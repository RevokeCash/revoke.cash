import { Contract, providers } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { OPENSEA_REGISTRY } from '../common/abis'
import { ADDRESS_ZERO, DUMMY_ADDRESS, DUMMY_ADDRESS_2, OPENSEA_REGISTRY_ADDRESS } from '../common/constants'
import { TokenMapping } from '../common/interfaces'
import { addressToAppName as addressToAppNameBase } from '../common/util'

export async function getTokenData(contract: Contract, ownerAddress: string, tokenMapping: TokenMapping = {}) {
  await throwIfNotErc721(contract)

  const balance = await contract.functions.balanceOf(ownerAddress)
  const tokenData = tokenMapping[getAddress(contract.address)]

  if (tokenData && tokenData.name) {
    // Retrieve info from the token mapping if available
    const { name } = tokenData
    return { balance, symbol: name }
  } else {
    // Wrap this in a try-catch since not every NFT has a name
    try {
      // If the token is not available in the token mapping, retrieve the info from Infura
      const [symbol] = await contract.functions.name()
      return { balance, symbol }
    } catch (e) {
      const symbol = '???'
      return { balance, symbol }
    }
  }
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

  // The only acceptable value for checking whether 0x00...00 has an allowance set to 0x00...01 is false
  // This could happen when the contract is not ERC721 but does have a fallback function
  if (isApprovedForAll !== false) {
    throw new Error('Response to isApprovedForAll was not false, indicating that this is not an ERC721 contract')
  }
}
