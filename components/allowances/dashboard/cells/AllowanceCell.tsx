import { PencilIcon } from '@heroicons/react/24/outline';
import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import Button from 'components/common/Button';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useRevoke } from 'lib/hooks/ethereum/useRevoke';
import type { AllowanceData } from 'lib/interfaces';
import { getAllowanceI18nValues } from 'lib/utils/allowances';
import { SECOND } from 'lib/utils/time';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import * as timeago from 'timeago.js';
import ControlsSection from '../../controls/ControlsSection';

interface Props {
  allowance: AllowanceData;
  onUpdate: (allowance: AllowanceData, newAmount?: string) => void;
}

const AllowanceCell = ({ allowance, onUpdate }: Props) => {
  const { t, lang } = useTranslation();
  const [editing, setEditing] = useState<boolean>();
  const { update } = useRevoke(allowance, onUpdate);
  const { i18nKey, amount, tokenId, symbol } = getAllowanceI18nValues(allowance);

  const classes = twMerge(
    !allowance.spender && 'text-zinc-500 dark:text-zinc-400',
    'flex items-center gap-2',
    ['ru', 'es'].includes(lang) ? 'w-48' : 'w-40',
  );

  if (editing) {
    return (
      <div className={classes}>
        <ControlsSection allowance={allowance} update={update} reset={() => setEditing(false)} />
      </div>
    );
  }

  const inTime = timeago.format((allowance.expiration ?? 0) * SECOND, lang);

  return (
    <div className={classes}>
      <div className="flex flex-col justify-start items-start">
        <div className="truncate">
          <Trans i18nKey={i18nKey} values={{ amount, tokenId, symbol }} />
        </div>
        {allowance.expiration && (
          <WithHoverTooltip tooltip={t('address:tooltips.permit2_expiration', { inTime })}>
            <div className="flex items-center gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {t('address:permit2.expiration', { inTime })}
            </div>
          </WithHoverTooltip>
        )}
      </div>
      {allowance.amount && (
        <ControlsWrapper chainId={allowance.chainId} address={allowance.owner} switchChainSize={undefined}>
          {(disabled) => (
            <div>
              <Button
                disabled={disabled}
                onClick={() => setEditing(!editing)}
                style="tertiary"
                size="none"
                aria-label="Edit Token Approval"
              >
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
