import LabelledCheckbox from 'components/common/LabelledCheckbox';
import { useAppContext } from 'lib/hooks/useAppContext';
import useTranslation from 'next-translate/useTranslation';
import AddressInput from '../AddressInput';
import TokenStandardSelection from '../TokenStandardSelection';

const DashboardHeader = () => {
  const { t } = useTranslation();
  const { tokenMapping, settings, setSettings } = useAppContext();

  return (
    <>
      <div className="py-2">
        <AddressInput />
      </div>

      <div className="py-2 flex flex-col">
        <div className="mx-auto">
          <TokenStandardSelection
            tokenStandard={settings.tokenStandard}
            setTokenStandard={(value) => setSettings({ ...settings, tokenStandard: value })}
          />
        </div>

        <div className="mx-auto py-2">
          {settings.tokenStandard === 'ERC20' && tokenMapping && (
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
        </div>
      </div>
    </>
  );
};

export default DashboardHeader;
