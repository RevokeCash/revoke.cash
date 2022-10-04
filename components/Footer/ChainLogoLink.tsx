import { getChainInfoUrl, getChainLogo, getChainName } from 'lib/utils/chains';
import React from 'react';
import LogoLink from '../common/LogoLink';

interface Props {
  chainId: number;
  size?: number;
}

const ChainLogoLink = ({ chainId, size }: Props) => (
  <LogoLink src={getChainLogo(chainId)} alt={getChainName(chainId)} href={getChainInfoUrl(chainId)} size={size} />
);

export default ChainLogoLink;
