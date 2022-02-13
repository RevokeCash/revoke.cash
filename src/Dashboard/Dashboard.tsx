import React, { useState, useEffect } from 'react'
import { TokenMapping } from '../common/interfaces'
import { getFullTokenMapping, isSupportedNetwork } from '../common/util'
import TokenList from './TokenList'
import { ClipLoader } from 'react-spinners'
import TokenStandardSelection from './TokenStandardSelection'
import UnregisteredTokensCheckbox from './UnregisteredTokensCheckbox'
import ZeroBalancesCheckbox from './ZeroBalancesCheckbox'
import AddressInput from './AddressInput'
import { useNetwork } from 'wagmi'


function Dashboard() {
  const [loading, setLoading] = useState<boolean>(true)
  const [tokenStandard, setTokenStandard] = useState<'ERC20' | 'ERC721'>('ERC20')
  const [includeUnregisteredTokens, setIncludeUnregisteredTokens] = useState<boolean>(false)
  const [includeZeroBalances, setIncludeZeroBalances] = useState<boolean>(false)
  const [tokenMapping, setTokenMapping] = useState<TokenMapping>()
  const [inputAddress, setInputAddress] = useState<string>()

  const [{ data: networkData }] = useNetwork()
  const chainId = networkData?.chain?.id ?? 1
  const networkName = networkData?.chain?.name ?? `Network with chainId ${chainId}`

  useEffect(() => {
    loadData()
  }, [chainId])

  const loadData = async () => {
    setLoading(true)
    setTokenMapping(await getFullTokenMapping(chainId))
    setLoading(false)
  }

  if (!isSupportedNetwork(chainId)) {
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
      <UnregisteredTokensCheckbox tokenStandard={tokenStandard} tokenMapping={tokenMapping} checked={includeUnregisteredTokens} update={setIncludeUnregisteredTokens} />
      <ZeroBalancesCheckbox checked={includeZeroBalances} update={setIncludeZeroBalances} />
      <TokenList
        tokenStandard={tokenStandard}
        inputAddress={inputAddress}
        filterRegisteredTokens={!includeUnregisteredTokens}
        filterZeroBalances={!includeZeroBalances}
        tokenMapping={tokenMapping}
      />
    </div>
  )
}

export default Dashboard
