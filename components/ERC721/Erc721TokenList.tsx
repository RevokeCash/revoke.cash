import { Contract } from 'ethers'
import { getAddress } from 'ethers/lib/utils'
import { Log } from '@ethersproject/abstract-provider'
import React, { useEffect, useState } from 'react'
import ClipLoader from 'react-spinners/ClipLoader'
import { Erc721TokenData, TokenMapping } from '../common/interfaces'
import Erc721Token from './Erc721Token'
import { getTokenIcon } from '../common/util'
import { generatePatchedAllowanceEvents, getOpenSeaProxyAddress, getTokenData } from './util'
import { ERC721Metadata } from '../common/abis'
import { useNetwork, useProvider } from 'wagmi'
import { providers as multicall } from '@0xsequence/multicall'

interface Props {
  filterUnverifiedTokens: boolean
  filterZeroBalances: boolean
  transferEvents: Log[]
  approvalEvents: Log[]
  approvalForAllEvents: Log[]
  tokenMapping?: TokenMapping
  inputAddress?: string
}

function Erc721TokenList({
  filterUnverifiedTokens,
  filterZeroBalances,
  transferEvents,
  approvalEvents,
  approvalForAllEvents,
  tokenMapping,
  inputAddress
}: Props) {
  const [tokens, setTokens] = useState<Erc721TokenData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [openSeaProxyAddress, setOpenSeaProxyAddress] = useState<string>()

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

    const openSeaProxy = await getOpenSeaProxyAddress(inputAddress, provider)
    const patchedApprovalForAllEvents = [
      ...approvalForAllEvents,
      ...generatePatchedAllowanceEvents(
        inputAddress,
        openSeaProxy,
        [...approvalEvents, ...approvalForAllEvents, ...transferEvents ]
      ),
    ]
    const allEvents = [...approvalEvents, ...patchedApprovalForAllEvents, ...transferEvents ];

    // Filter unique token contract addresses and convert all events to Contract instances
    const tokenContracts = allEvents
      .filter((event, i) => i === allEvents.findIndex((other) => event.address === other.address))
      .map((event) => new Contract(getAddress(event.address), ERC721Metadata, provider))

    // Look up token data for all tokens, add their lists of approvals
    const unsortedTokens = await Promise.all(
      tokenContracts.map(async (contract) => {
        const approvalsForAll = patchedApprovalForAllEvents.filter(approval => approval.address === contract.address)
        const approvals = approvalEvents.filter(approval => approval.address === contract.address)
        const icon = await getTokenIcon(contract.address, chainId, tokenMapping)

        // Skip verification checks for NFTs
        const verified = true

        try {
          const tokenData = await getTokenData(contract, inputAddress, tokenMapping)
          return { ...tokenData, icon, contract, verified, approvals, approvalsForAll }
        } catch {
          // If the call to getTokenData() fails, the token is not an ERC721 token so
          // we do not include it in the token list.
          return undefined
        }
      })
    )

    // Filter undefined tokens and sort tokens alphabetically on token symbol
    const sortedTokens = unsortedTokens
      .filter((token) => token !== undefined)
      .sort((a: any, b: any) => a.symbol.localeCompare(b.symbol))

    setTokens(sortedTokens)
    setOpenSeaProxyAddress(openSeaProxy)
    setLoading(false)
  }

  if (loading) {
    return (<ClipLoader css="margin: 10px;" size={40} color={'#000'} loading={loading} />)
  }

  if (tokens.length === 0) {
    return (<div className="TokenList">No token balances</div>)
  }

  const tokenComponents = tokens
  .filter((token) => !filterUnverifiedTokens || token.verified)
  .filter((token) => !filterZeroBalances || !(token.balance === '0'))
  .map((token) => (
    <Erc721Token
      key={token.contract.address}
      token={token}
      inputAddress={inputAddress}
      openSeaProxyAddress={openSeaProxyAddress}
    />
  ))

return (<div className="TokenList">{tokenComponents}</div>)
}

export default Erc721TokenList
