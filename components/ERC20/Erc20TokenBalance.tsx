import React from 'react';
import { toFloat } from '../common/util';

interface Props {
  symbol: string;
  icon: string;
  balance: string;
  decimals: number;
  explorerUrl: string;
}

function Erc20TokenBalance({ symbol, icon, balance, decimals, explorerUrl }: Props) {
  const backupImage = (ev) => {
    (ev.target as HTMLImageElement).src = '/erc20.png';
  };
  const img = <img src={icon} alt={symbol} width="24" onError={backupImage} style={{ borderRadius: '50%' }} />;

  return (
    <div className="TokenBalance">
      <a href={explorerUrl} style={{ color: 'black', margin: 0 }} target="_blank">
        {img}
        {symbol}: {toFloat(Number(balance), decimals)}
      </a>
    </div>
  );
}

export default Erc20TokenBalance;
