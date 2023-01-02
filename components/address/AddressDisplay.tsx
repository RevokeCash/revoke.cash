import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { shortenAddress, writeToClipBoard } from 'lib/utils';
import { classNames } from 'lib/utils/styles';

interface Props {
  address: string;
  domainName?: string;
  className?: string;
  withCopyButton?: boolean;
  withTooltip?: boolean;
}

const AddressDisplay = ({ address, domainName, className, withCopyButton, withTooltip }: Props) => {
  const classes = classNames('flex gap-1 items-center leading-none', className);

  return (
    <div className={classes}>
      {withTooltip ? (
        <WithHoverTooltip tooltip={address}>
          <span>{domainName ?? shortenAddress(address)}</span>
        </WithHoverTooltip>
      ) : (
        domainName ?? shortenAddress(address)
      )}
      {withCopyButton && (
        <Button style="none" size="none" onClick={() => writeToClipBoard(address)}>
          <DocumentDuplicateIcon className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default AddressDisplay;
