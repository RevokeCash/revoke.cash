import { Contract } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { ADDRESS_ZERO } from '../common/constants'
import { TokenMapping } from '../common/interfaces'

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
