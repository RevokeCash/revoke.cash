import ChainLogo from 'components/common/ChainLogo';
import { CHAIN_SELECT_MAINNETS, CHAIN_SELECT_TESTNETS } from 'lib/constants';
import { useEthereum } from 'lib/hooks/useEthereum';
import useTranslation from 'next-translate/useTranslation';
import React from 'react';
import { Dropdown } from 'react-bootstrap';
import ChainSelectDropdownButton from './ChainSelectDropdownButton';

const ChainSelectDropdown: React.FC = () => {
  const { t } = useTranslation();
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
        <Dropdown.Header>{t('dashboard:mainnets')}</Dropdown.Header>
        {CHAIN_SELECT_MAINNETS.map((chainId) => (
          <ChainSelectDropdownButton chainId={chainId} />
        ))}
        <Dropdown.Header>{t('dashboard:testnets')}</Dropdown.Header>
        {CHAIN_SELECT_TESTNETS.map((chainId) => (
          <ChainSelectDropdownButton chainId={chainId} />
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default ChainSelectDropdown;
