import React from 'react';
import Logo from './Logo';
import { getChainLogo, getChainName } from './util';

interface Props {
  chainId: number;
  size?: number;
}

const ChainLogo = ({ chainId, size }: Props) => (
  <Logo src={getChainLogo(chainId)} alt={getChainName(chainId)} size={size} />
);

export default ChainLogo;
