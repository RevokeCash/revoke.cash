import LogoLink from 'components/common/LogoLink';
import ShareButton from 'components/common/ShareButton';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useColorTheme } from 'lib/hooks/useColorTheme';
import { getChainExplorerUrl } from 'lib/utils/chains';

interface Props {
  address: string;
}

const AddressSocialShareButtons = ({ address }: Props) => {
  const { darkMode } = useColorTheme();
  const { selectedChainId } = useAddressPageContext();

  const explorerUrl = getChainExplorerUrl(selectedChainId);

  return (
    <div className="flex items-center gap-6 sm:gap-2">
      <LogoLink src="/assets/images/vendor/opensea.svg" alt="OpenSea Link" href={`https://opensea.io/${address}`} />
      <LogoLink
        src={darkMode ? '/assets/images/vendor/etherscan-light.svg' : '/assets/images/vendor/etherscan.svg'}
        alt="Block Explorer Link"
        href={`${explorerUrl}/address/${address}`}
        className="dark:bg-black"
      />
      <ShareButton />
    </div>
  );
};

export default AddressSocialShareButtons;
