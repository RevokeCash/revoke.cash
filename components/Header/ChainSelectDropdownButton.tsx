import ChainLogo from 'components/common/ChainLogo';
import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { getChainName } from '../common/util';

interface Props {
  chainId: number;
}

const ChainSelectDropdownButton = ({ chainId }: Props) => {
  return (
    <Dropdown.Item
      style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'black', padding: '0.25rem 1rem' }}
    >
      <ChainLogo chainId={chainId} />
      {getChainName(chainId)}
    </Dropdown.Item>
  );
};

export default ChainSelectDropdownButton;
