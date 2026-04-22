import CopyButton from 'components/common/CopyButton';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { shortenAddress } from 'lib/utils/formatting';
import { twMerge } from 'tailwind-merge';

interface Props {
  address: string;
  domainName?: string;
  className?: string;
  copyButtonClassName?: string;
  withCopyButton?: boolean;
  withTooltip?: boolean;
}

const AddressDisplay = ({
  address,
  domainName,
  className,
  copyButtonClassName,
  withCopyButton,
  withTooltip,
}: Props) => {
  const classes = twMerge('flex gap-1 items-center', className, 'leading-none');

  return (
    <div className={classes}>
      {withTooltip ? (
        <WithHoverTooltip tooltip={address}>
          <span>{domainName ?? shortenAddress(address, 6)}</span>
        </WithHoverTooltip>
      ) : (
        (domainName ?? shortenAddress(address, 6))
      )}
      {withCopyButton && <CopyButton content={address} className={copyButtonClassName} />}
    </div>
  );
};

export default AddressDisplay;
