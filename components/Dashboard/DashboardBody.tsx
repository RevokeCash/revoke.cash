import useTranslation from 'next-translate/useTranslation';
import React, { useState } from 'react';
import LabelledCheckbox from '../common/LabelledCheckbox';
import AddressInput from './AddressInput';
import TokenList from './TokenList';
import TokenStandardSelection from './TokenStandardSelection';

function DashboardBody() {
  const { t } = useTranslation();
  const [tokenStandard, setTokenStandard] = useState<'ERC20' | 'ERC721'>('ERC20');
  const [includeUnverifiedTokens, setIncludeVerifiedTokens] = useState<boolean>(false);
  const [includeTokensWithoutBalances, setIncludeTokensWithoutBalances] = useState<boolean>(false);
  const [includeTokensWithoutAllowances, setIncludeTokensWithoutAllowances] = useState<boolean>(false);
  const [inputAddress, setInputAddress] = useState<string>();

  return (
    <div className="Dashboard">
      <AddressInput inputAddress={inputAddress} setInputAddress={setInputAddress} />
      <TokenStandardSelection tokenStandard={tokenStandard} setTokenStandard={setTokenStandard} />
      {tokenStandard === 'ERC20' && (
        <LabelledCheckbox
          label={t('dashboard:controls.unverified_tokens')}
          checked={includeUnverifiedTokens}
          update={setIncludeVerifiedTokens}
        />
      )}
      <LabelledCheckbox
        label={t('dashboard:controls.no_balances')}
        checked={includeTokensWithoutBalances}
        update={setIncludeTokensWithoutBalances}
      />
      <LabelledCheckbox
        label={t('dashboard:controls.no_allowances')}
        checked={includeTokensWithoutAllowances}
        update={setIncludeTokensWithoutAllowances}
      />
      <TokenList
        tokenStandard={tokenStandard}
        inputAddress={inputAddress}
        settings={{ includeUnverifiedTokens, includeTokensWithoutBalances, includeTokensWithoutAllowances }}
      />
    </div>
  );
}

export default DashboardBody;
