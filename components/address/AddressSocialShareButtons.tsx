import { ShareIcon } from '@heroicons/react/24/solid';
import Button from 'components/common/Button';
import LogoLink from 'components/common/LogoLink';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import { writeToClipBoard } from 'lib/utils';
import { getChainExplorerUrl } from 'lib/utils/chains';
import useTranslation from 'next-translate/useTranslation';

interface Props {
  address: string;
}

const AddressSocialShareButtons = ({ address }: Props) => {
  const { darkMode } = useColorTheme();
  const { t } = useTranslation();
  const { selectedChainId } = useAddressPageContext();

  const explorerUrl = getChainExplorerUrl(selectedChainId);

  return (
    <div className="flex items-center gap-2">
      <LogoLink src="/assets/images/vendor/opensea.svg" alt="OpenSea Link" href={`https://opensea.io/${address}`} />
      <LogoLink
        src={darkMode ? '/assets/images/vendor/etherscan-light.svg' : '/assets/images/vendor/etherscan.svg'}
        alt="Block Explorer Link"
        href={`${explorerUrl}/address/${address}`}
      />
      <Button style="tertiary" size="none" onClick={() => writeToClipBoard(location.href, t)}>
        <ShareIcon className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default AddressSocialShareButtons;
