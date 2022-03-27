import React, { useState, useEffect } from 'react'
import { TokenMapping } from '../common/interfaces'
import { emitAnalyticsEvent, getFullTokenMapping, isBackendSupportedNetwork, isProviderSupportedNetwork } from '../common/util'
import TokenList from './TokenList'
import { ClipLoader } from 'react-spinners'
import TokenStandardSelection from './TokenStandardSelection'
import UnverifiedTokensCheckbox from './UnverifiedTokensCheckbox'
import ZeroBalancesCheckbox from './ZeroBalancesCheckbox'
import AddressInput from './AddressInput'
import { useConnect, useNetwork } from 'wagmi'
import axios from 'axios'
import { providers } from 'ethers'
import { providers as multicall } from '@0xsequence/multicall'
import { ProviderContext } from 'utils/context/ProviderContext'

declare let window: {
  ethereum?: any
  web3?: any
  location: any
}

function Dashboard() {
  // Manage a provider separately from wagmi so that we can use the same multicall provider in the entire app
  const [provider, setProvider] = useState<providers.BaseProvider>()
  const [loading, setLoading] = useState<boolean>(true)
  const [tokenStandard, setTokenStandard] = useState<'ERC20' | 'ERC721'>('ERC20')
  const [includeUnverifiedTokens, setIncludeVerifiedTokens] = useState<boolean>(false)
  const [includeZeroBalances, setIncludeZeroBalances] = useState<boolean>(false)
  const [tokenMapping, setTokenMapping] = useState<TokenMapping>()
  const [inputAddress, setInputAddress] = useState<string>()

  const [{ data: networkData }] = useNetwork()
  const [{ data: connectData }] = useConnect()
  const wagmiProvider = connectData.connectors[0]?.getProvider()

  const chainId = networkData?.chain?.id ?? 1
  const networkName = networkData?.chain?.name ?? `Network with chainId ${chainId}`

  useEffect(() => {
    const updateProvider = async (newProvider: providers.Provider) => {
      const { chainId } = await newProvider.getNetwork()
      emitAnalyticsEvent(`connect_wallet_${chainId}`)
      const multicallProvider = new multicall.MulticallProvider(newProvider, { verbose: true })
      setProvider(multicallProvider)
    }

    const connectProvider = async () => {
      if (wagmiProvider) {
        await updateProvider(new providers.Web3Provider(wagmiProvider))
        console.log('Using injected "wagmi" provider')
      } else if (window.ethereum) {
        const provider = new providers.Web3Provider(window.ethereum)
        await updateProvider(provider)
        console.log('Using injected "window.ethereum" provider')
      } else if (window.web3 && window.web3.currentProvider) {
        const provider = new providers.Web3Provider(window.web3.currentProvider)
        await updateProvider(provider)
        console.log('Using injected "window.web3" provider')
      } else {
        try {
          // Use a default provider with a free Infura key if web3 is not available
          const newProvider = new providers.InfuraProvider('mainnet', `${'88583771d63544aa'}${'ba1006382275c6f8'}`)

          // Check that the provider is available (and not rate-limited) by sending a dummy request
          const dummyRequest = '{"method":"eth_getCode","params":["0x1f9840a85d5af5bf1d1762f925bdaddc4201f984","latest"],"id":0,"jsonrpc":"2.0"}'
          await axios.post(newProvider.connection.url, dummyRequest)
          await updateProvider(newProvider)
          console.log('Using fallback Infura provider')
        } catch {
          console.log('No web3 provider available')
        }
      }
    }

    connectProvider()
  }, [wagmiProvider])

  useEffect(() => {
    loadData()
  }, [provider])

  const loadData = async () => {
    if (!provider) return

    setLoading(true)

    // Use the provider's chain ID to prevent concurrency issues
    const { chainId: chainIdFromProvider } = await provider.getNetwork()
    console.log('chain id from provider', chainIdFromProvider)
    console.log('chain id from wagmi', chainId)
    if (isBackendSupportedNetwork(chainIdFromProvider)) await axios.post('/api/login')
    setTokenMapping(await getFullTokenMapping(chainIdFromProvider))

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
    <ProviderContext.Provider value={provider} >
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
    </ProviderContext.Provider>
  )
}

export default Dashboard
