import React from 'react'
import { toFloat } from '../common/util'

interface Props {
  symbol: string
  icon: string
  balance: string
  decimals: number
}

function Erc20TokenBalance({ symbol, icon, balance, decimals }: Props) {
  const backupImage = (ev) => { (ev.target as HTMLImageElement).src = '/erc20.png'}
  const img = (<img src={icon} alt="" width="20px" onError={backupImage} />)

  return (<div className="TokenBalance my-auto">{img} {symbol}: {toFloat(Number(balance), decimals)}</div>)
}

export default Erc20TokenBalance
