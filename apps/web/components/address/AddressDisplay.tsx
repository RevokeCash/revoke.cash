import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import CopyButton from 'components/common/CopyButton';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { twMerge } from 'tailwind-merge';

interface Props {
  address: string;
  domainName?: string;
  className?: string;
  copyButtonClassName?: string;
  withCopyButton?: boolean;
  withTooltip?: boolean;
  as?: 'h1' | 'div';
}

const AddressDisplay = ({
  address,
  domainName,
  className,
  copyButtonClassName,
  withCopyButton,
  withTooltip,
  as: Component = 'div',
}: Props) => {
  // Undo the base layer's h1 font styles so the heading semantics don't change the appearance
  const headingResetClasses = Component === 'h1' ? 'font-sans tracking-normal' : undefined;
  const classes = twMerge('flex gap-1 items-center', headingResetClasses, className, 'leading-none');

  return (
    <Component className={classes}>
      {withTooltip ? (
        <WithHoverTooltip tooltip={address}>
          <span>{domainName ?? shortenAddress(address, 6)}</span>
        </WithHoverTooltip>
      ) : (
        (domainName ?? shortenAddress(address, 6))
      )}
      {withCopyButton && <CopyButton content={address} className={copyButtonClassName} />}
    </Component>
  );
};

export default AddressDisplay;
