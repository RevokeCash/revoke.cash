import type { Row } from '@tanstack/react-table';
import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import Checkbox from 'components/common/Checkbox';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import type { TokenAllowanceData } from 'lib/utils/allowances';
import { isRevertedError } from 'lib/utils/errors';
import { useTranslations } from 'next-intl';

interface Props {
  row: Row<TokenAllowanceData>;
}

const SelectCell = ({ row }: Props) => {
  const t = useTranslations();
  const { address, selectedChainId } = useAddressPageContext();

  // If the row is not selectable because of a revoke error, we still want to show the (disabled) checkbox
  if (!row.getCanSelect() && !row.original.payload?.revokeError) return null;

  const tooltip = isRevertedError(row.original.payload?.revokeError)
    ? t('common.toasts.revoke_failed_revert', { message: row.original.payload?.revokeError })
    : row.original.payload?.revokeError;

  return (
    <ControlsWrapper
      chainId={selectedChainId}
      address={address}
      overrideDisabled={Boolean(tooltip)}
      disabledReason={tooltip}
    >
      {(disabled) => (
        <div className="w-fit">
          <Checkbox
            disabled={disabled}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            iconClassName="max-sm:w-5 max-sm:h-5"
          />
        </div>
      )}
    </ControlsWrapper>
  );
};

export default SelectCell;
