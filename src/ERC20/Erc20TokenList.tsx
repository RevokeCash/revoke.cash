import { Contract } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { Log } from '@ethersproject/abstract-provider'
import React, { useEffect, useState } from 'react'
import ClipLoader from 'react-spinners/ClipLoader'
import { Erc20TokenData, TokenMapping } from '../common/interfaces'
import Erc20Token from './Erc20Token'
import { isRegistered, getTokenIcon, toFloat } from '../common/util'
import { getTokenData } from './util'
import { ERC20 } from '../common/abis'
import { useNetwork, useProvider } from 'wagmi'
import { providers as multicall } from '@0xsequence/multicall'

interface Props {
  filterRegisteredTokens: boolean
  filterZeroBalances: boolean
  transferEvents: Log[]
  approvalEvents: Log[]
  tokenMapping?: TokenMapping
  inputAddress?: string
}

function Erc20TokenList({
  filterRegisteredTokens,
  filterZeroBalances,
  transferEvents,
  approvalEvents,
  tokenMapping,
  inputAddress
}: Props) {
  const [tokens, setTokens] = useState<Erc20TokenData[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const provider = useProvider()
  const [{ data: networkData }] = useNetwork()
  const chainId = networkData?.chain?.id ?? 1

  useEffect(() => {
    loadData()
  }, [inputAddress, provider])

  const loadData = async () => {
    if (!inputAddress) return
    if (!(provider instanceof multicall.MulticallProvider)) return

    setLoading(true)

    const allEvents = [...approvalEvents, ...transferEvents]

    // Filter unique token contract addresses and convert all events to Contract instances
    const tokenContracts = allEvents
      .filter((event, i) => i === allEvents.findIndex((other) => event.address === other.address))
      .map((event) => new Contract(getAddress(event.address), ERC20, provider))

    const unsortedTokens = await Promise.all(
      tokenContracts.map(async (contract) => {
        const tokenApprovals = approvalEvents.filter(approval => approval.address === contract.address)
        const registered = isRegistered(contract.address, tokenMapping)
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
    return (<ClipLoader css="margin: 10px;" size={40} color={'#000'} loading={loading} />)
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
      inputAddress={inputAddress}
    />
  ))

return (<div className="TokenList">{tokenComponents}</div>)
}

export default Erc20TokenList
