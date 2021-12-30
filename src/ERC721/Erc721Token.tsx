import { providers, Signer } from 'ethers'
import React, { useEffect, useState } from 'react'
import { ClipLoader } from 'react-spinners'
import { Erc721TokenData } from '../common/interfaces'
import { Allowance } from './interfaces'
import Erc721AllowanceList from './Erc721AllowanceList'
import Erc721TokenBalance from './Erc721TokenBalance'
import { addDisplayAddressesToAllowances, getLimitedAllowancesFromApprovals, getUnlimitedAllowancesFromApprovals } from './util'
import { getExplorerUrl } from '../common/util'

interface Props {
  provider: providers.Provider
  chainId: number
  signer?: Signer
  token: Erc721TokenData
  signerAddress: string
  inputAddress: string
  openSeaProxyAddress?: string
}

function Erc721Token({ signer, provider, chainId, token, signerAddress, inputAddress, openSeaProxyAddress }: Props) {
  const [allowances, setAllowances] = useState<Allowance[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    loadData()
  }, [inputAddress])

  const loadData = async () => {
    setLoading(true)

    const unlimitedAllowances = await getUnlimitedAllowancesFromApprovals(token.contract, inputAddress, token.approvalsForAll)
    const limitedAllowances = await getLimitedAllowancesFromApprovals(token.contract, token.approvals)
    const allAllowances = [...limitedAllowances, ...unlimitedAllowances]
      .filter(allowance => allowance !== undefined)

    const allowancesWithDisplayAddresses = await addDisplayAddressesToAllowances(allAllowances, provider, chainId, openSeaProxyAddress)

    setAllowances(allowancesWithDisplayAddresses)
    setLoading(false)
  }

  // // Do not render tokens without balance or allowances
  const balanceString = String(token.balance)
  if (balanceString === '0' && allowances.length === 0) return null

  if (loading) {
    return (<div className="Token"><ClipLoader size={20} color={'#000'} loading={loading} /></div>)
  }
  const allowanceEquals = (a: Allowance, b: Allowance) => a.spender === b.spender && a.tokenId === b.tokenId
  const explorerUrl = `${getExplorerUrl(chainId)}/${token.contract.address}`

  return (
    <div className="Token">
      <Erc721TokenBalance
        symbol={token.symbol}
        icon={token.icon}
        balance={token.balance}
        explorerUrl={explorerUrl}
      />
      <Erc721AllowanceList
        signer={signer}
        provider={provider}
        token={token}
        allowances={allowances}
        inputAddress={inputAddress}
        signerAddress={signerAddress}
        chainId={chainId}
        onRevoke={(allowance: Allowance) => {
          setAllowances((previousAllowances) => previousAllowances.filter((other) => !allowanceEquals(other, allowance)))
        }}
      />
    </div>
  )
}

export default Erc721Token
