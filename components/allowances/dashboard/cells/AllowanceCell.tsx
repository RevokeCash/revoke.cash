import { PencilIcon } from '@heroicons/react/24/outline';
import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import Button from 'components/common/Button';
import { useRevoke } from 'lib/hooks/ethereum/useRevoke';
import type { AllowanceData } from 'lib/interfaces';
import { getAllowanceI18nValues } from 'lib/utils/allowances';
import Trans from 'next-translate/Trans';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
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
      <div className="flex items-center w-40">
        <ControlsSection allowance={allowance} update={update} reset={() => setEditing(false)} />
      </div>
    );
  }

  const classes = twMerge(!allowance.spender && 'text-zinc-400 dark:text-zinc-500', 'flex items-center gap-2 w-40');

  return (
    <div className={classes}>
      <div className="truncate">
        <Trans i18nKey={i18nKey} values={{ amount, tokenId, symbol }} />
      </div>
      {allowance.amount && (
        <ControlsWrapper chainId={allowance.chainId} address={allowance.owner} switchChainSize={undefined}>
          {(disabled) => (
            <div>
              <Button disabled={disabled} onClick={() => setEditing(!editing)} style="tertiary" size="none">
                <PencilIcon className="w-3 h-3" />
              </Button>
            </div>
          )}
        </ControlsWrapper>
      )}
    </div>
  );
};

export default AllowanceCell;
