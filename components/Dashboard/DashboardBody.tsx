import React, { useState } from 'react';
import { useAsync } from 'react-async-hook';
import { ClipLoader } from 'react-spinners';
import { useEthereum } from 'utils/hooks/useEthereum';
import { getFullTokenMapping, isBackendSupportedNetwork, isProviderSupportedNetwork } from '../common/util';
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
  const { result: tokenMapping, loading } = useAsync(getFullTokenMapping, [chainId]);

  if (loading) {
    return (
      <div className="Dashboard">
        <ClipLoader css="margin: 10px;" size={40} color={'#000'} loading={loading} />
      </div>
    );
  }

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
        tokenMapping={tokenMapping}
        checked={includeUnverifiedTokens}
        update={setIncludeVerifiedTokens}
      />
      <ZeroBalancesCheckbox checked={includeZeroBalances} update={setIncludeZeroBalances} />
      <TokenList
        tokenStandard={tokenStandard}
        inputAddress={inputAddress}
        filterUnverifiedTokens={!includeUnverifiedTokens}
        filterZeroBalances={!includeZeroBalances}
        tokenMapping={tokenMapping}
      />
    </div>
  );
}

export default DashboardBody;
