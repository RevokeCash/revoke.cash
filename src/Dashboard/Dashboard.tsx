import { Signer, providers } from 'ethers'
import React, { useState, useEffect } from 'react'
import { TokenMapping } from '../common/interfaces'
import { getFullTokenMapping, isSupportedNetwork } from '../common/util'
import TokenList from './TokenList'
import { ClipLoader } from 'react-spinners'
import TokenStandardSelection from './TokenStandardSelection'
import UnregisteredTokensCheckbox from './UnregisteredTokensCheckbox'
import ZeroBalancesCheckbox from './ZeroBalancesCheckbox'

interface Props {
  provider: providers.Provider
  chainId: number,
  signer?: Signer
  signerAddress?: string
  inputAddress?: string
}

function Dashboard({
  provider,
  chainId,
  signer,
  signerAddress,
  inputAddress,
}: Props) {
  const [loading, setLoading] = useState<boolean>(true)
  const [tokenStandard, setTokenStandard] = useState<'ERC20' | 'ERC721'>('ERC20')
  const [includeUnregisteredTokens, setIncludeUnregisteredTokens] = useState<boolean>(false)
  const [includeZeroBalances, setIncludeZeroBalances] = useState<boolean>(false)
  const [tokenMapping, setTokenMapping] = useState<TokenMapping>()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setTokenMapping(await getFullTokenMapping(chainId))
    setLoading(false)
  }

  if (!isSupportedNetwork(chainId)) {
    return (
      <div style={{ paddingBottom: 10 }}>Network with chainId {chainId} is not supported.</div>
    )
  }

  if (!inputAddress) {
    return null;
  }

  if (loading) {
    return (<ClipLoader css="margin-bottom: 10px;" size={40} color={'#000'} loading={loading} />)
  }

  return (
    <div className="Dashboard">
      <TokenStandardSelection tokenStandard={tokenStandard} setTokenStandard={setTokenStandard} />
      <UnregisteredTokensCheckbox tokenStandard={tokenStandard} tokenMapping={tokenMapping} checked={includeUnregisteredTokens} update={setIncludeUnregisteredTokens} />
      <ZeroBalancesCheckbox checked={includeZeroBalances} update={setIncludeZeroBalances} />
      <TokenList
        provider={provider}
        chainId={chainId}
        signer={signer}
        tokenStandard={tokenStandard}
        signerAddress={signerAddress}
        inputAddress={inputAddress}
        filterRegisteredTokens={!includeUnregisteredTokens}
        filterZeroBalances={!includeZeroBalances}
        tokenMapping={tokenMapping}
      />
    </div>
  )
}

export default Dashboard
