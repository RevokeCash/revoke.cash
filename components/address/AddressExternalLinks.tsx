import { ArrowUpRightIcon } from '@heroicons/react/24/outline';
import Href from 'components/common/Href';
import { getChainExplorerUrl } from 'lib/utils/chains';

interface Props {
  address: string;
  chainId: number;
}

const AddressExternalLinks = ({ address, chainId }: Props) => {
  const explorerUrl = getChainExplorerUrl(chainId);
  const explorerBaseUrl = explorerUrl.replace('https://', '');

  return (
    <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
      <AddressExternalLink href={`${explorerUrl}/address/${address}`}>{explorerBaseUrl}</AddressExternalLink>
      <AddressExternalLink href={`https://debank.com/profile/${address}`}>debank.com</AddressExternalLink>
      <AddressExternalLink href={`https://opensea.io/${address}`}>opensea.io</AddressExternalLink>
    </div>
  );
};

interface AddressExternalLinkProps {
  href: string;
  children: React.ReactNode;
}

const AddressExternalLink = ({ href, children }: AddressExternalLinkProps) => {
  return (
    <Href href={href} external underline="hover" className="flex items-center gap-1">
      {children}
      <ArrowUpRightIcon className="w-3 h-3" />
    </Href>
  );
};

export default AddressExternalLinks;
