import CopyButton from 'components/common/CopyButton';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { shortenAddress } from 'lib/utils';
import useTranslation from 'next-translate/useTranslation';
import { twMerge } from 'tailwind-merge';

interface Props {
  address: string;
  domainName?: string;
  className?: string;
  withCopyButton?: boolean;
  withTooltip?: boolean;
}

const AddressDisplay = ({ address, domainName, className, withCopyButton, withTooltip }: Props) => {
  const { t } = useTranslation();

  const classes = twMerge('flex gap-1 items-center', className, 'leading-none');

  return (
    <div className={classes}>
      {withTooltip ? (
        <WithHoverTooltip tooltip={address}>
          <span>{domainName ?? shortenAddress(address)}</span>
        </WithHoverTooltip>
      ) : (
        domainName ?? shortenAddress(address)
      )}
      {withCopyButton && <CopyButton content={address} />}
    </div>
  );
};

export default AddressDisplay;
