import { getBalanceText } from 'lib/utils';
import React from 'react';
import TokenLogo from '../common/TokenLogo';

interface Props {
  symbol: string;
  icon: string;
  balance: string;
  decimals?: number;
  explorerUrl: string;
}

const TokenBalance = ({ symbol, icon, balance, decimals, explorerUrl }: Props) => (
  <div className="TokenBalance">
    <a href={explorerUrl} style={{ color: 'black' }}>
      <TokenLogo src={icon} alt={symbol} />
      {getBalanceText(symbol, balance, decimals)}
    </a>
  </div>
);

export default TokenBalance;
