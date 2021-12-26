import { Signer, Contract, providers } from 'ethers'
import { Interface, getAddress, hexZeroPad } from 'ethers/lib/utils'
import React, { useEffect, useState } from 'react'
import ClipLoader from 'react-spinners/ClipLoader'
import { Erc20TokenData, TokenMapping } from '../common/interfaces'
import Erc20Token from './Erc20Token'
import { isRegistered, getTokenIcon, toFloat } from '../common/util'
import { getTokenData } from './util'
import { ERC20 } from '../common/abis'

interface Props {
  provider: providers.Provider
  chainId: number
  filterRegisteredTokens: boolean
  filterZeroBalances: boolean
  tokenMapping?: TokenMapping
  signer?: Signer
  signerAddress?: string
  inputAddress?: string
}

function Erc20TokenList({
  provider,
  chainId,
  filterRegisteredTokens,
  filterZeroBalances,
  tokenMapping,
  signer,
  signerAddress,
  inputAddress
}: Props) {
  const [tokens, setTokens] = useState<Erc20TokenData[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    loadData()
  }, [inputAddress])

  const loadData = async () => {
    if (!inputAddress) return

    setLoading(true)

    const erc20Interface = new Interface(ERC20)
    const latestBlockNumber = await provider.getBlockNumber()

    // Get all approvals made from the input address
    const approvals = await provider.getLogs({
      fromBlock: 0,
      toBlock: latestBlockNumber,
      topics: [erc20Interface.getEventTopic('Approval'), hexZeroPad(inputAddress, 32)]
    })

    // Get all transfers sent to the input address
    const transfers = await provider.getLogs({
      fromBlock: 0,
      toBlock: latestBlockNumber,
      topics: [erc20Interface.getEventTopic('Transfer'), undefined, hexZeroPad(inputAddress, 32)]
    })

    const allEvents = [...approvals, ...transfers];

    // Filter unique token contract addresses and convert all events to Contract instances
    const tokenContracts = allEvents
      .filter((event, i) => i === allEvents.findIndex((other) => event.address === other.address))
      .map((event) => new Contract(getAddress(event.address), ERC20, signer ?? provider))

    // Look up token data for all tokens, add their list of approvals,
    // and check if the token is registered in Kleros T2CR
    const unsortedTokens = await Promise.all(
      tokenContracts.map(async (contract) => {
        const tokenApprovals = approvals.filter(approval => approval.address === contract.address)
        const registered = await isRegistered(contract.address, provider, tokenMapping)
        const icon = await getTokenIcon(contract.address, chainId, tokenMapping)

        try {
          const tokenData = await getTokenData(contract, inputAddress, tokenMapping)
          return { ...tokenData, icon, contract, registered, approvals: tokenApprovals }
        } catch {
          // If the call to getTokenData() fails, the token is not an ERC20 token so
          // we do not include it in the token list (should not happen).
          return undefined
        }
      })
    )

    // Filter undefined tokens and sort tokens alphabetically on token symbol
    const sortedTokens = unsortedTokens
      .filter((token) => token !== undefined)
      .sort((a: any, b: any) => a.symbol.localeCompare(b.symbol))

    setTokens(sortedTokens)
    setLoading(false)
  }

  if (loading) {
    return (<ClipLoader css="margin-bottom: 10px;" size={40} color={'#000'} loading={loading} />)
  }

  if (tokens.length === 0) {
    return (<div className="TokenList">No token balances</div>)
  }

  const tokenComponents = tokens
  .filter((token) => !filterRegisteredTokens || token.registered)
  .filter((token) => !filterZeroBalances || !(toFloat(Number(token.balance), token.decimals) === '0.000'))
  .map((token) => (
    <Erc20Token
      key={token.contract.address}
      token={token}
      provider={provider}
      chainId={chainId}
      signerAddress={signerAddress}
      inputAddress={inputAddress}
    />
  ))

return (<div className="TokenList">{tokenComponents}</div>)
}

export default Erc20TokenList
