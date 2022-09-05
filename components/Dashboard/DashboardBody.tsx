import React, { useState } from 'react';
import { useEthereum } from 'utils/hooks/useEthereum';
import { isBackendSupportedNetwork, isProviderSupportedNetwork } from '../common/util';
import AddressInput from './AddressInput';
import TokenList from './TokenList';
import TokenStandardSelection from './TokenStandardSelection';
import UnverifiedTokensCheckbox from './UnverifiedTokensCheckbox';
import ZeroBalancesCheckbox from './ZeroBalancesCheckbox';

function DashboardBody() {
  const [tokenStandard, setTokenStandard] = useState<'ERC20' | 'ERC721'>('ERC20');
  const [includeUnverifiedTokens, setIncludeVerifiedTokens] = useState<boolean>(false);
  const [includeZeroBalances, setIncludeZeroBalances] = useState<boolean>(false);
  const [inputAddress, setInputAddress] = useState<string>();
  const { chainId, chainName } = useEthereum();

  if (!chainId) {
    return <div>Please use a Web3 enabled browser to use Revoke.cash.</div>;
  }

  if (!isProviderSupportedNetwork(chainId) && !isBackendSupportedNetwork(chainId)) {
    return <div>{chainName} is not supported.</div>;
  }

  return (
    <div className="Dashboard">
      <AddressInput inputAddress={inputAddress} setInputAddress={setInputAddress} />
      <TokenStandardSelection tokenStandard={tokenStandard} setTokenStandard={setTokenStandard} />
      <UnverifiedTokensCheckbox
        tokenStandard={tokenStandard}
        checked={includeUnverifiedTokens}
        update={setIncludeVerifiedTokens}
      />
      <ZeroBalancesCheckbox checked={includeZeroBalances} update={setIncludeZeroBalances} />
      <TokenList
        tokenStandard={tokenStandard}
        inputAddress={inputAddress}
        filterUnverifiedTokens={!includeUnverifiedTokens}
        filterZeroBalances={!includeZeroBalances}
      />
    </div>
  );
}

export default DashboardBody;
