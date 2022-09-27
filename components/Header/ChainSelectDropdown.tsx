import ChainLogo from 'components/common/ChainLogo';
import { NETWORK_SELECT_MAINNETS, NETWORK_SELECT_TESTNETS } from 'components/common/constants';
import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { useEthereum } from 'utils/hooks/useEthereum';
import ChainSelectDropdownButton from './ChainSelectDropdownButton';

const ChainSelectDropdown: React.FC = () => {
  const { selectedChainId } = useEthereum();

  return (
    <Dropdown>
      <Dropdown.Toggle
        variant="outline-primary"
        style={{ display: 'flex', alignItems: 'center', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
      >
        <ChainLogo chainId={selectedChainId} />
      </Dropdown.Toggle>
      <Dropdown.Menu style={{ height: '300px', width: '220px', overflowY: 'scroll' }}>
        <Dropdown.Header>Mainnets</Dropdown.Header>
        {NETWORK_SELECT_MAINNETS.map((chainId) => (
          <ChainSelectDropdownButton chainId={chainId} />
        ))}
        <Dropdown.Header>Testnets</Dropdown.Header>
        {NETWORK_SELECT_TESTNETS.map((chainId) => (
          <ChainSelectDropdownButton chainId={chainId} />
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ChainSelectDropdown;
