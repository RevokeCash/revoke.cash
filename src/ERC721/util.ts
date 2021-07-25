import { Contract, providers } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { OPENSEA_REGISTRY } from '../common/abis'
import { ADDRESS_ZERO, OPENSEA_REGISTRY_ADDRESS } from '../common/constants'
import { TokenMapping } from '../common/interfaces'
import { addressToAppName as addressToAppNameBase } from '../common/util'

export async function getTokenData(contract: Contract, ownerAddress: string, tokenMapping: TokenMapping = {}) {
  const balance = await contract.functions.balanceOf(ownerAddress)

  // Call isApprovedForAll to check that this is an ERC721 token (or throw)
  await contract.functions.isApprovedForAll(ADDRESS_ZERO, ADDRESS_ZERO);

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
  const contract = new Contract(OPENSEA_REGISTRY_ADDRESS, OPENSEA_REGISTRY, provider)
  const [proxyAddress] = await contract.functions.proxies(userAddress)
  if (!proxyAddress || proxyAddress === ADDRESS_ZERO) return undefined
  return proxyAddress
}
