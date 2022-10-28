import { DashboardSettings } from 'lib/interfaces';
import useTranslation from 'next-translate/useTranslation';
import { useState } from 'react';
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
  const [settings, setSettings] = useLocalStorage<DashboardSettings>('settings', DEFAULT_SETTINGS);
  const [tokenStandard, setTokenStandard] = useState<'ERC20' | 'ERC721'>('ERC20');
  const [inputAddress, setInputAddress] = useState<string>();

  return (
    <div className="Dashboard">
      <AddressInput inputAddress={inputAddress} setInputAddress={setInputAddress} />
      <TokenStandardSelection tokenStandard={tokenStandard} setTokenStandard={setTokenStandard} />
      {tokenStandard === 'ERC20' && (
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
      <TokenList tokenStandard={tokenStandard} inputAddress={inputAddress} settings={settings} />
    </div>
  );
}

export default DashboardBody;
