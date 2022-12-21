import { ShareIcon } from '@heroicons/react/24/solid';
import Button from 'components/common/Button';
import LogoLink from 'components/common/LogoLink';
import { writeToClipBoard } from 'lib/utils';

interface Props {
  address: string;
}

const AddressSocialShareButtons = ({ address }: Props) => {
  return (
    <div className="flex items-center gap-2">
      <LogoLink src="/assets/images/vendor/opensea.svg" alt="OpenSea Link" href={`https://opensea.io/${address}`} />
      <LogoLink
        src="/assets/images/vendor/etherscan.svg"
        alt="Etherscan Link"
        href={`https://etherscan.io/address/${address}`}
      />
      <Button style="tertiary" size="none" onClick={() => writeToClipBoard(location.href)}>
        <ShareIcon className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default AddressSocialShareButtons;
