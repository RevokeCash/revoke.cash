import ChainLogo from 'components/common/ChainLogo';
import { useEthereum } from 'lib/hooks/useEthereum';
import { getChainName } from 'lib/utils';
import React from 'react';
import { Dropdown } from 'react-bootstrap';

interface Props {
  chainId: number;
}

const ChainSelectDropdownButton = ({ chainId }: Props) => {
  const { selectChain } = useEthereum();

  return (
    <Dropdown.Item
      style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'black', padding: '0.25rem 1rem' }}
      onSelect={() => selectChain(chainId)}
    >
      <ChainLogo chainId={chainId} />
      {getChainName(chainId)}
    </Dropdown.Item>
  );
};

export default ChainSelectDropdownButton;
