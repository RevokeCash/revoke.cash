import DropdownMenu, { DropdownMenuItem } from 'components/common/DropdownMenu';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { useTranslations } from 'next-intl';

interface Props {
  address: string;
}

const AddressSocialShareButtons = ({ address }: Props) => {
  const t = useTranslations();
  const { selectedChainId } = useAddressPageContext();

  const explorerUrl = getChainExplorerUrl(selectedChainId);
  const explorerBaseUrl = explorerUrl.replace('https://', '');

  return (
    <div className="flex items-center gap-6 sm:gap-2">
      <DropdownMenu menuButton={t('common.buttons.explorer_links')} buttonClassName="font-normal" style="nav">
        <DropdownMenuItem href={`${explorerUrl}/address/${address}`} external className="justify-end">
          {explorerBaseUrl}
        </DropdownMenuItem>
        <DropdownMenuItem href={`https://debank.com/profile/${address}`} external className="justify-end">
          debank.com
        </DropdownMenuItem>
        <DropdownMenuItem href={`https://opensea.io/${address}`} external className="justify-end">
          opensea.io
        </DropdownMenuItem>
      </DropdownMenu>
    </div>
  );
};

export default AddressSocialShareButtons;
