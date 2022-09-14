import { fallbackTokenIconOnError } from 'components/common/util';
import React from 'react';

interface Props {
  symbol: string;
  icon: string;
  balance: string;
  explorerUrl: string;
}

function Erc721TokenBalance({ symbol, icon, balance, explorerUrl }: Props) {
  const img = (
    <img src={icon} alt={symbol} width="24" onError={fallbackTokenIconOnError} style={{ borderRadius: '50%' }} />
  );
  const balanceText = balance === 'ERC1155' ? `${symbol} (ERC1155)` : `${symbol}: ${String(balance)}`;

  return (
    <div className="TokenBalance">
      <a href={explorerUrl} style={{ color: 'black' }}>
        {img} {balanceText}
      </a>
    </div>
  );
}

export default Erc721TokenBalance;
