import Button from 'components/common/Button';
import Pencil from 'components/common/Pencil';
import { useRevoke } from 'lib/hooks/useRevoke';
import type { AllowanceData } from 'lib/interfaces';
import { getAllowanceI18nValues } from 'lib/utils/allowances';
import { classNames } from 'lib/utils/styles';
import Trans from 'next-translate/Trans';
import { useState } from 'react';
import ControlsSection from '../../controls/ControlsSection';

interface Props {
  allowance: AllowanceData;
  onUpdate: (allowance: AllowanceData, newAmount?: string) => void;
}

const AllowanceCell = ({ allowance, onUpdate }: Props) => {
  const [editing, setEditing] = useState<boolean>();
  const { update } = useRevoke(allowance, onUpdate);
  const { i18nKey, amount, tokenId, symbol } = getAllowanceI18nValues(allowance);

  if (editing) {
    return (
      <div className="flex">
        <ControlsSection allowance={allowance} update={update} reset={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className={classNames(!allowance.spender && 'text-gray-400', 'flex items-center gap-2')}>
      <Trans i18nKey={i18nKey} values={{ amount, tokenId, symbol }} />
      {allowance.amount && (
        <Button onClick={() => setEditing(!editing)} style="none" size="none">
          <Pencil className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
};

export default AllowanceCell;
