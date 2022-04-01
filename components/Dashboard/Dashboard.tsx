import React, { useState, useEffect } from 'react'
import { TokenMapping } from '../common/interfaces'
import { getFullTokenMapping, isBackendSupportedNetwork, isProviderSupportedNetwork } from '../common/util'
import TokenList from './TokenList'
import { ClipLoader } from 'react-spinners'
import TokenStandardSelection from './TokenStandardSelection'
import UnverifiedTokensCheckbox from './UnverifiedTokensCheckbox'
import ZeroBalancesCheckbox from './ZeroBalancesCheckbox'
import AddressInput from './AddressInput'
import axios from 'axios'
import { useEthereum } from 'utils/hooks/useEthereum'

function Dashboard() {
  const [loading, setLoading] = useState<boolean>(true)
  const [tokenStandard, setTokenStandard] = useState<'ERC20' | 'ERC721'>('ERC20')
  const [includeUnverifiedTokens, setIncludeVerifiedTokens] = useState<boolean>(false)
  const [includeZeroBalances, setIncludeZeroBalances] = useState<boolean>(false)
  const [tokenMapping, setTokenMapping] = useState<TokenMapping>()
  const [inputAddress, setInputAddress] = useState<string>()

  const { chainId } = useEthereum();

  const networkName = `Network with chainId ${chainId}`

  useEffect(() => {
    loadData()
  }, [chainId])

  const loadData = async () => {
    if (!chainId) return

    setLoading(true)

    if (isBackendSupportedNetwork(chainId)) await axios.post('/api/login')
    setTokenMapping(await getFullTokenMapping(chainId))

    setLoading(false)
  }

  if (!isProviderSupportedNetwork(chainId) && !isBackendSupportedNetwork(chainId)) {
    return (
      <div>{networkName} is not supported.</div>
    )
  }

  if (loading) {
    return (<ClipLoader css="margin: 10px;" size={40} color={'#000'} loading={loading} />)
  }

  return (
    <div className="Dashboard">
      <AddressInput setInputAddress={setInputAddress} />
      <TokenStandardSelection tokenStandard={tokenStandard} setTokenStandard={setTokenStandard} />
      <UnverifiedTokensCheckbox tokenStandard={tokenStandard} tokenMapping={tokenMapping} checked={includeUnverifiedTokens} update={setIncludeVerifiedTokens} />
      <ZeroBalancesCheckbox checked={includeZeroBalances} update={setIncludeZeroBalances} />
      <TokenList
        tokenStandard={tokenStandard}
        inputAddress={inputAddress}
        filterUnverifiedTokens={!includeUnverifiedTokens}
        filterZeroBalances={!includeZeroBalances}
        tokenMapping={tokenMapping}
      />
    </div>
  )
}

export default Dashboard
