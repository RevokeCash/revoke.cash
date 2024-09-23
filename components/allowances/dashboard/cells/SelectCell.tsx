import { Row } from '@tanstack/react-table';
import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import IndeterminateCheckbox from 'components/common/IndeterminateCheckbox';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { AllowanceData } from 'lib/interfaces';

interface Props {
  row: Row<AllowanceData>;
}

const SelectCell = ({ row }: Props) => {
  const { address, selectedChainId } = useAddressPageContext();
  if (!row.getCanSelect()) return null;

  return (
    <ControlsWrapper chainId={selectedChainId} address={address}>
      {(disabled) => (
        <div>
          <IndeterminateCheckbox
            disabled={disabled}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        </div>
      )}
    </ControlsWrapper>
  );
};

export default SelectCell;
