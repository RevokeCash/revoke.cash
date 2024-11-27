import { Row } from '@tanstack/react-table';
import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import Checkbox from 'components/common/Checkbox';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { TokenAllowanceData } from 'lib/utils/allowances';

interface Props {
  row: Row<TokenAllowanceData>;
}

const SelectCell = ({ row }: Props) => {
  const { address, selectedChainId } = useAddressPageContext();
  if (!row.getCanSelect()) return null;

  return (
    <ControlsWrapper chainId={selectedChainId} address={address}>
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
