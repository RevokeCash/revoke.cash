import { getChainLogo, getChainName } from 'lib/utils';
import React from 'react';
import Logo from './Logo';

interface Props {
  chainId: number;
  size?: number;
}

const ChainLogo = ({ chainId, size }: Props) => (
  <Logo src={getChainLogo(chainId)} alt={getChainName(chainId)} size={size} />
);

export default ChainLogo;
