import SelectDropdown from 'components/common/SelectDropdown';
import { CHAIN_SELECT_MAINNETS, CHAIN_SELECT_TESTNETS } from 'lib/constants';
import { useEthereum } from 'lib/hooks/useEthereum';
import { getChainLogo, getChainName } from 'lib/utils/chains';
import useTranslation from 'next-translate/useTranslation';
import React from 'react';

const ChainSelectDropdown: React.FC = () => {
  const { t } = useTranslation();
  const { selectedChainId } = useEthereum();

  const mainnetChainItems = CHAIN_SELECT_MAINNETS.map((chainId) => {
    return {
      img: getChainLogo(chainId),
      text: getChainName(chainId),
    };
  });

  const testnetChainItems = CHAIN_SELECT_TESTNETS.map((chainId) => {
    return {
      img: getChainLogo(chainId),
      text: getChainName(chainId),
    };
  });

  // TODO: Add testnet items
  return <SelectDropdown items={mainnetChainItems} />;

  // return (
  //   <Dropdown>
  //     <Dropdown.Toggle
  //       variant="outline-primary"
  //       style={{ display: 'flex', alignItems: 'center', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
  //     >
  //       <ChainLogo chainId={selectedChainId} />
  //     </Dropdown.Toggle>
  //     <Dropdown.Menu style={{ height: '300px', width: '220px', overflowY: 'scroll' }}>
  //       <Dropdown.Header>{t('dashboard:mainnets')}</Dropdown.Header>
  //       {CHAIN_SELECT_MAINNETS.map((chainId) => (
  //         <ChainSelectDropdownButton chainId={chainId} />
  //       ))}
  //       <Dropdown.Header>{t('dashboard:testnets')}</Dropdown.Header>
  //       {CHAIN_SELECT_TESTNETS.map((chainId) => (
  //         <ChainSelectDropdownButton chainId={chainId} />
  //       ))}
  //     </Dropdown.Menu>
  //   </Dropdown>
  // );
};

export default ChainSelectDropdown;
