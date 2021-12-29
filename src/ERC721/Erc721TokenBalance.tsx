import React from 'react'
import { BigNumber } from 'ethers'

interface Props {
  symbol: string
  icon: string
  balance: BigNumber
  explorerUrl: string
}

function Erc721TokenBalance({ symbol, icon, balance, explorerUrl }: Props) {
  const backupImage = (ev) => { (ev.target as HTMLImageElement).src = 'erc721.png'}
  const img = (<img src={icon} alt="" width="20px" onError={backupImage} />)

  return (
    <div className="TokenBalance my-auto">
      <a href={explorerUrl} style={{ color: 'black' }}>{img} {symbol}: {String(balance)}</a>
    </div>
  )
}

export default Erc721TokenBalance
