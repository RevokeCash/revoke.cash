import React, { useEffect, useState } from 'react'
import { Form } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { ClipLoader } from 'react-spinners'
import { BigNumber, Contract } from 'ethers'
import { formatAllowance } from './util'
import { Erc20TokenData } from '../common/interfaces'
import { addressToAppName, shortenAddress, getDappListName, getExplorerUrl, lookupEnsName, fromFloat, emitAnalyticsEvent } from '../common/util'
import RevokeButton from '../common/RevokeButton'
import UpdateInputGroup from '../common/UpdateInputGroup'
import { useAccount, useNetwork, useProvider, useSigner } from 'wagmi'

interface Props {
  spender: string
  allowance: string
  inputAddress: string
  token: Erc20TokenData
  onRevoke: (spender: string) => void;
}

function Erc20Allowance({ spender, allowance, inputAddress, token, onRevoke}: Props) {
  const [loading, setLoading] = useState<boolean>(true)
  const [ensSpender, setEnsSpender] = useState<string | undefined>()
  const [spenderAppName, setSpenderAppName] = useState<string | undefined>()
  const [updatedAllowance, setUpdatedAllowance] = useState<string | undefined>()

  const provider = useProvider()
  const [{ data: signer }] = useSigner()
  const [{ data: accountData }] = useAccount()
  const [{ data: networkData }] = useNetwork()
  const chainId = networkData?.chain?.id ?? 1

  useEffect(() => {
    loadData()
  }, [spender, allowance])

  const loadData = async () => {
    setLoading(true)

    const newEnsSpender = await lookupEnsName(spender, provider)
    setEnsSpender(newEnsSpender)

    const dappListNetworkName = getDappListName(chainId)
    const newSpenderAppName = await addressToAppName(spender, dappListNetworkName)
    setSpenderAppName(newSpenderAppName)

    setLoading(false)
  }

  const revoke = async () => update('0')

  const update = async (newAllowance: string) => {
    const bnNew = BigNumber.from(fromFloat(newAllowance, token.decimals))
    const writeContract = new Contract(token.contract.address, token.contract.interface, signer ?? provider)

    let tx
    // Not all ERC20 contracts allow for simple changes in approval to be made
    // https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    // so we tell the user to revoke instead if the contract doesn't allow the simple use
    // of contract.approve(0)
    try {
      console.debug(`Calling contract.approve(${spender}, ${bnNew.toString()})`)
      tx = await writeContract.functions.approve(spender, bnNew)
    } catch (e) {
      const code = e.error?.code ?? e.code
      console.debug(`failed, code ${code}`)
      if (code === -32000) {
        toast.error("This token does not support updating allowances, please revoke instead", {
          position: "top-left",
        })
      }

      // ignore other errors
      console.log('Ran into issue while revoking', e)
    }

    if (tx) {
      await tx.wait(1)
      console.debug('Reloading data')

      if (newAllowance === '0') {
        onRevoke(spender)
        emitAnalyticsEvent("erc20_revoke")
      } else {
        // TODO: Update allowance order after update
        setUpdatedAllowance(fromFloat(newAllowance, token.decimals))
        emitAnalyticsEvent("erc20_update")
      }
    }
  }

  if (loading) {
    return (<div><ClipLoader size={10} color={'#000'} loading={loading} /></div>)
  }

  const spenderDisplay = spenderAppName || ensSpender || spender
  const shortenedSpenderDisplay = spenderAppName || ensSpender || shortenAddress(spender)

  const explorerBaseUrl = getExplorerUrl(chainId)

  const shortenedLink = explorerBaseUrl
    ? (<a className="monospace" href={`${explorerBaseUrl}/${spender}`}>{shortenedSpenderDisplay}</a>)
    : shortenedSpenderDisplay

  const regularLink = explorerBaseUrl
    ? (<a className="monospace" href={`${explorerBaseUrl}/${spender}`}>{spenderDisplay}</a>)
    : spenderDisplay

  const canUpdate = inputAddress === accountData?.address

  return (
    <Form inline className="Allowance" key={spender}>
      {/* Display separate spans for the regular and shortened versions of the spender address */}
      {/* The correct one is selected using CSS media-queries */}
      <Form.Label className="AllowanceText">
        <span className="AllowanceTextSmallScreen">
          {formatAllowance(updatedAllowance ?? allowance, token.decimals, token.totalSupply)} allowance to&nbsp;{shortenedLink}
        </span>

        <span className="AllowanceTextBigScreen">
          {formatAllowance(updatedAllowance ?? allowance, token.decimals, token.totalSupply)} allowance to&nbsp;{regularLink}
        </span>
      </Form.Label>
      {<RevokeButton canRevoke={canUpdate} revoke={revoke} id={`revoke-${token.symbol}-${spender}`} />}
      {<UpdateInputGroup canUpdate={canUpdate} update={update} id={`update-${token.symbol}-${spender}`} />}
    </Form>
  )
}

export default Erc20Allowance
