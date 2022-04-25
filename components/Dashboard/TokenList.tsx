import React, { useCallback, useEffect, useState } from 'react'
import { Log } from '@ethersproject/abstract-provider'
import { TokenMapping } from '../common/interfaces'
import Erc20TokenList from '../ERC20/Erc20TokenList'
import Erc721TokenList from '../ERC721/Erc721TokenList'
import { hexZeroPad, Interface } from 'ethers/lib/utils'
import { ERC721Metadata } from '../common/abis'
import { getLogs, isBackendSupportedNetwork } from '../common/util'
import { ClipLoader } from 'react-spinners'
import { useEthereum } from 'utils/hooks/useEthereum'
import axios from 'axios'

interface Props {
  filterUnverifiedTokens: boolean
  filterZeroBalances: boolean
  tokenStandard: string
  tokenMapping?: TokenMapping
  inputAddress?: string
}

function TokenList({
  filterUnverifiedTokens,
  filterZeroBalances,
  tokenStandard,
  tokenMapping,
  inputAddress,
}: Props) {
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error>(null)
  const [transferEvents, setTransferEvents] = useState<Log[]>()
  const [approvalEvents, setApprovalEvents] = useState<Log[]>()
  const [approvalForAllEvents, setApprovalForAllEvents] = useState<Log[]>()

  const { chainId, provider } = useEthereum();

  const loadData = useCallback(async () => {
    try {
      if (!inputAddress) return
      if (!provider || !chainId) return

      setLoading(true)

      const erc721Interface = new Interface(ERC721Metadata)
      const latestBlockNumber = await provider.getBlockNumber()

      // Create a backend session if needed
      if (isBackendSupportedNetwork(chainId)) await axios.post('/api/login')

      // NOTE: The Transfer and Approval events have a similar signature for ERC20 and ERC721
      // and the ApprovalForAll event has a similar signature for ERC721 and ERC1155
      // so we only request these events once here and pass them to the other components

      // Get all transfers sent to the input address
      const transferFilter = {
        topics: [erc721Interface.getEventTopic('Transfer'), undefined, hexZeroPad(inputAddress, 32)]
      }
      const foundTransferEvents = await getLogs(provider, transferFilter, 0, latestBlockNumber, chainId)
      setTransferEvents(foundTransferEvents)
      console.log('Transfer events', foundTransferEvents)

      // Get all approvals made from the input address
      const approvalFilter = {
        topics: [erc721Interface.getEventTopic('Approval'), hexZeroPad(inputAddress, 32)]
      }
      const foundApprovalEvents = await getLogs(provider, approvalFilter, 0, latestBlockNumber, chainId)
      setApprovalEvents(foundApprovalEvents)
      console.log('Approval events', foundApprovalEvents)

      // Get all "approvals for all indexes" made from the input address
      const approvalForAllFilter = {
        topics: [erc721Interface.getEventTopic('ApprovalForAll'), hexZeroPad(inputAddress, 32)]
      }
      const foundApprovalForAllEvents = await getLogs(provider, approvalForAllFilter, 0, latestBlockNumber, chainId)
      setApprovalForAllEvents(foundApprovalForAllEvents)
      console.log('ApprovalForAll events', foundApprovalForAllEvents)

      setLoading(false)
    } catch (e) {
      console.log(e)
      setError(e)
    }

  }, [inputAddress, chainId])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (!inputAddress) {
    return null;
  }

  if (error) {
    return (<div style={{ marginTop: '20px' }}>{error.message}</div>)
  }

  if (loading || [transferEvents, approvalEvents, approvalForAllEvents].includes(undefined)) {
    return (<ClipLoader css="margin: 10px;" size={40} color={'#000'} loading={loading} />)
  }

  if (tokenStandard === 'ERC20') {
    return (
      <Erc20TokenList
        inputAddress={inputAddress}
        filterUnverifiedTokens={filterUnverifiedTokens}
        filterZeroBalances={filterZeroBalances}
        tokenMapping={tokenMapping}
        transferEvents={transferEvents}
        approvalEvents={approvalEvents}
      />
    );
  } else {
    return (
      <Erc721TokenList
        inputAddress={inputAddress}
        filterUnverifiedTokens={filterUnverifiedTokens}
        filterZeroBalances={filterZeroBalances}
        tokenMapping={tokenMapping}
        transferEvents={transferEvents}
        approvalEvents={approvalEvents}
        approvalForAllEvents={approvalForAllEvents}
      />
    );
  }
}

export default TokenList
