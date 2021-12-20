import { providers } from 'ethers'
import { getAddress, hexDataSlice } from 'ethers/lib/utils'
import React, { useEffect, useState } from 'react'
import { ClipLoader } from 'react-spinners'
import { Allowance, Erc20TokenData } from '../common/interfaces'
import { compareBN, toFloat } from '../common/util'
import Erc20AllowanceList from './Erc20AllowanceList'
import Erc20TokenBalance from './Erc20TokenBalance'
import { formatAllowance } from './util'

interface Props {
  provider: providers.Provider
  chainId: number
  token: Erc20TokenData
  signerAddress: string
  inputAddress: string
}


function Erc20Token({ provider, chainId, token, signerAddress, inputAddress }: Props) {
  const [allowances, setAllowances] = useState<Allowance[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    loadData()
  }, [inputAddress])

  const loadData = async () => {
    setLoading(true)

    // Filter out duplicate spenders
    const approvals = token.approvals
      .filter((approval, i) => i === token.approvals.findIndex(other => approval.topics[2] === other.topics[2]))

    // Retrieve current allowance for these Approval events
    let loadedAllowances: Allowance[] = await Promise.all(approvals.map(async (ev) => {
      const spender = getAddress(hexDataSlice(ev.topics[2], 12))
      const allowance = (await token.contract.functions.allowance(inputAddress, spender)).toString()

      // Filter (almost) zero-value allowances early to save bandwidth
      if (formatAllowance(allowance, token.decimals, token.totalSupply) === '0.000') return undefined

      return { spender, allowance }
    }))

    // Filter out zero-value allowances and sort from high to low
    loadedAllowances = loadedAllowances
      .filter(allowance => allowance !== undefined)
      .sort((a, b) => -1 * compareBN(a.allowance, b.allowance))

    setAllowances(loadedAllowances)
    setLoading(false)
  }

  // Do not render tokens without balance or allowances
  const balanceString = toFloat(Number(token.balance), token.decimals)
  if (balanceString === '0.000' && allowances.length === 0) return null

  if (loading) {
    return (<div className="Token"><ClipLoader size={20} color={'#000'} loading={loading} /></div>)
  }

  return (
      <div className="Token">
        <Erc20TokenBalance
          symbol={token.symbol}
          icon={token.icon}
          balance={token.balance}
          decimals={token.decimals}
        />
        <Erc20AllowanceList
          provider={provider}
          inputAddress={inputAddress}
          signerAddress={signerAddress}
          chainId={chainId}
          token={token}
          allowances={allowances}
          onRevoke={(spender) => {
            setAllowances((previousAllowances) => previousAllowances.filter(allowance => allowance.spender !== spender))
          }}
        />
      </div>
    )
}

export default Erc20Token
