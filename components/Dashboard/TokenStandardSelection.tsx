import { Switch } from '@headlessui/react';
import StyledSwitch from 'components/common/StyledSwitch';
import type { TokenStandard } from 'lib/interfaces';
import useTranslation from 'next-translate/useTranslation';

interface Props {
  tokenStandard: TokenStandard;
  setTokenStandard: (tokenStandard: TokenStandard) => void;
}

const TokenStandardSelection = ({ tokenStandard, setTokenStandard }: Props) => {
  const { t } = useTranslation();

  return (
    <Switch.Group as="div" className="flex items-center gap-2">
      <Switch.Label as="span">
        <span className="text-sm font-medium text-gray-600">{t('dashboard:controls.tokens')}</span>
      </Switch.Label>
      <StyledSwitch
        checked={tokenStandard === 'ERC721'}
        onChange={(checked: boolean) => setTokenStandard(checked ? 'ERC721' : 'ERC20')}
      />
      <Switch.Label as="span">
        <span className="text-sm font-medium text-gray-600">{t('dashboard:controls.nfts')}</span>
      </Switch.Label>
    </Switch.Group>
  );
};

export default TokenStandardSelection;
