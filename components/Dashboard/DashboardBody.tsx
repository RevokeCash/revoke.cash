import { useEthereum } from 'lib/hooks/useEthereum';
import { DashboardSettings } from 'lib/interfaces';
import { getFullTokenMapping } from 'lib/utils/tokens';
import useTranslation from 'next-translate/useTranslation';
import { useState } from 'react';
import { useAsync } from 'react-async-hook';
import useLocalStorage from 'use-local-storage';
import LabelledCheckbox from '../common/LabelledCheckbox';
import AddressInput from './AddressInput';
import TokenList from './TokenList';
import TokenStandardSelection from './TokenStandardSelection';

const DEFAULT_SETTINGS = {
  includeUnverifiedTokens: true,
  includeTokensWithoutBalances: true,
  includeTokensWithoutAllowances: true,
};

function DashboardBody() {
  const { t } = useTranslation();
  const { selectedChainId } = useEthereum();

  const [settings, setSettings] = useLocalStorage<DashboardSettings>('settings', DEFAULT_SETTINGS);
  const [tokenStandard, setTokenStandard] = useState<'ERC20' | 'ERC721'>('ERC20');
  const [inputAddress, setInputAddress] = useState<string>();

  const { result: tokenMapping } = useAsync(getFullTokenMapping, [selectedChainId]);

  return (
    <div className="Dashboard">
      <AddressInput inputAddress={inputAddress} setInputAddress={setInputAddress} />
      <TokenStandardSelection tokenStandard={tokenStandard} setTokenStandard={setTokenStandard} />
      {tokenStandard === 'ERC20' && tokenMapping && (
        <LabelledCheckbox
          label={t('dashboard:controls.unverified_tokens')}
          checked={settings.includeUnverifiedTokens}
          update={(value) => setSettings({ ...settings, includeUnverifiedTokens: value })}
        />
      )}
      <LabelledCheckbox
        label={t('dashboard:controls.no_balances')}
        checked={settings.includeTokensWithoutBalances}
        update={(value) => setSettings({ ...settings, includeTokensWithoutBalances: value })}
      />
      <LabelledCheckbox
        label={t('dashboard:controls.no_allowances')}
        checked={settings.includeTokensWithoutAllowances}
        update={(value) => setSettings({ ...settings, includeTokensWithoutAllowances: value })}
      />
      <TokenList
        tokenStandard={tokenStandard}
        inputAddress={inputAddress}
        settings={settings}
        tokenMapping={tokenMapping}
      />
    </div>
  );
}

export default DashboardBody;
