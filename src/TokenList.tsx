import React, { useEffect, useState } from 'react'
import { Signer, providers } from 'ethers'
import { Log } from '@ethersproject/abstract-provider'
import { TokenMapping } from './common/interfaces'
import Erc20TokenList from './ERC20/Erc20TokenList'
import Erc721TokenList from './ERC721/Erc721TokenList'
import { hexZeroPad, Interface } from 'ethers/lib/utils'
import { ERC721Metadata } from './common/abis'
import { getLogs } from './common/util'
import { ClipLoader } from 'react-spinners'

interface Props {
  provider: providers.Provider
  chainId: number
  filterRegisteredTokens: boolean
  filterZeroBalances: boolean
  tokenStandard: string
  tokenMapping?: TokenMapping
  signer?: Signer
  signerAddress?: string
  inputAddress?: string
}

function TokenList({
  provider,
  chainId,
  filterRegisteredTokens,
  filterZeroBalances,
  tokenStandard,
  tokenMapping,
  signer,
  signerAddress,
  inputAddress,
}: Props) {
  const [loading, setLoading] = useState<boolean>(true)
  const [transferEvents, setTransferEvents] = useState<Log[]>()
  const [approvalEvents, setApprovalEvents] = useState<Log[]>()
  const [approvalForAllEvents, setApprovalForAllEvents] = useState<Log[]>()

  useEffect(() => {
    loadData()
  }, [inputAddress])

  const loadData = async () => {
    if (!inputAddress) return;

    const erc721Interface = new Interface(ERC721Metadata)
    const latestBlockNumber = await provider.getBlockNumber()

    setLoading(true);

    // NOTE: The Transfer and Approval events have a similar signature for ERC20 and ERC721
    // so we only request these events once here and pass them to the other components

    // Get all transfers sent to the input address
    const transferFilter = {
      topics: [erc721Interface.getEventTopic('Transfer'), undefined, hexZeroPad(inputAddress, 32)]
    }
    const foundTransferEvents = await getLogs(provider, transferFilter, 0, latestBlockNumber)

    // Get all approvals made from the input address
    const approvalFilter = {
      topics: [erc721Interface.getEventTopic('Approval'), hexZeroPad(inputAddress, 32)]
    }
    const foundApprovalEvents = await getLogs(provider, approvalFilter, 0, latestBlockNumber)

    // Get all "approvals for all indexes" made from the input address
    const approvalForAllFilter = {
      topics: [erc721Interface.getEventTopic('ApprovalForAll'), hexZeroPad(inputAddress, 32)]
    }
    const foundApprovalForAllEvents = await getLogs(provider, approvalForAllFilter, 0, latestBlockNumber)

    setTransferEvents(foundTransferEvents)
    setApprovalEvents(foundApprovalEvents)
    setApprovalForAllEvents(foundApprovalForAllEvents)
    setLoading(false)
  }

  if (!inputAddress) {
    return null;
  }

  if (loading || [transferEvents, approvalEvents, approvalForAllEvents].includes(undefined)) {
    return (<ClipLoader css="margin-bottom: 10px;" size={40} color={'#000'} loading={loading} />)
  }

  if (tokenStandard === 'ERC20') {
    console.log('hello')
    return (
      <Erc20TokenList
        provider={provider}
        chainId={chainId}
        signer={signer}
        signerAddress={signerAddress}
        inputAddress={inputAddress}
        filterRegisteredTokens={filterRegisteredTokens}
        filterZeroBalances={filterZeroBalances}
        tokenMapping={tokenMapping}
        transferEvents={transferEvents}
        approvalEvents={approvalEvents}
      />
    );
  } else {
    return (
      <Erc721TokenList
        provider={provider}
        chainId={chainId}
        signer={signer}
        signerAddress={signerAddress}
        inputAddress={inputAddress}
        filterRegisteredTokens={filterRegisteredTokens}
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
