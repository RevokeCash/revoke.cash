import React from 'react'
import { Erc721TokenData } from '../common/interfaces'
import { shortenAddress, getExplorerUrl, emitAnalyticsEvent } from '../common/util'
import { Form } from 'react-bootstrap'
import { ADDRESS_ZERO } from '../common/constants'
import RevokeButton from '../common/RevokeButton'
import { Allowance } from './interfaces'
import { formatAllowance } from './util'
import { Contract } from 'ethers'
import { useEthereum } from 'utils/hooks/useEthereum'

interface Props {
  token: Erc721TokenData
  allowance: Allowance
  inputAddress: string
  onRevoke: (allowance: Allowance) => void;
}

function Erc721Allowance({ token, allowance, inputAddress, onRevoke }: Props) {
  const { spender, ensSpender, spenderAppName, tokenId } = allowance

  const { signer, provider, account, chainId } = useEthereum();

  const revoke = async () => {
    const writeContract = new Contract(token.contract.address, token.contract.interface, signer ?? provider)

    let tx
    try {
      tx = tokenId === undefined
        ? await writeContract.functions.setApprovalForAll(spender, false)
        : await writeContract.functions.approve(ADDRESS_ZERO, tokenId)

    } catch (e) {
      // Ignore issues
      console.log('Ran into issue while revoking', e)
    }

    if (tx) {
      await tx.wait(1)

      if (tokenId === undefined) {
        emitAnalyticsEvent("erc721_revoke_all")
      } else {
        emitAnalyticsEvent("erc721_revoke_single")
      }

      onRevoke(allowance)
    }
  }

  const spenderDisplay = spenderAppName || ensSpender || spender
  const shortenedSpenderDisplay = spenderAppName || ensSpender || shortenAddress(spender)
  const explorerBaseUrl = getExplorerUrl(chainId)

  const shortenedLink = explorerBaseUrl
    ? (<a className="monospace" href={`${explorerBaseUrl}/address/${spender}`}>{shortenedSpenderDisplay}</a>)
    : shortenedSpenderDisplay

  const regularLink = explorerBaseUrl
    ? (<a className="monospace" href={`${explorerBaseUrl}/address/${spender}`}>{spenderDisplay}</a>)
    : spenderDisplay

  const canUpdate = inputAddress === account

  return (
    <Form inline className="Allowance" key={spender}>
      {/* Display separate spans for the regular and shortened versions of the spender address */}
      {/* The correct one is selected using CSS media-queries */}
      <Form.Label className="AllowanceText">
          <span className="only-mobile-inline">
            {formatAllowance(tokenId)} to&nbsp;{shortenedLink}
          </span>
          <span className="only-desktop-inline">
            {formatAllowance(tokenId)} to&nbsp;{regularLink}
          </span>
        </Form.Label>
      {<RevokeButton canRevoke={canUpdate} revoke={revoke} id={`revoke-${token.symbol}-${spender}`} />}
    </Form>
  )
}

export default Erc721Allowance
