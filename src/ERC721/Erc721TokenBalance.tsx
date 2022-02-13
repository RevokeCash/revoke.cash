import React from 'react'

interface Props {
  symbol: string
  icon: string
  balance: string
  explorerUrl: string
}

function Erc721TokenBalance({ symbol, icon, balance, explorerUrl }: Props) {
  const backupImage = (ev) => { (ev.target as HTMLImageElement).src = '/erc721.png'}
  const img = (<img src={icon} alt="" width="20px" onError={backupImage} />)

  const balanceText = balance === 'ERC1155' ? `${symbol} (ERC1155)` : `${symbol}: ${String(balance)}`

  return (
    <div className="TokenBalance my-auto">
      <a href={explorerUrl} style={{ color: 'black' }}>{img} {balanceText}</a>
    </div>
  )
}

export default Erc721TokenBalance
