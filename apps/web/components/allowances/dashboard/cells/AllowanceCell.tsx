import { PencilIcon } from '@heroicons/react/24/outline';
import {
  AllowanceType,
  getAllowanceI18nValues,
  isErc20Allowance,
  type OnUpdate,
  type TokenAllowanceData,
} from '@revoke.cash/core/allowances';
import { DAY, SECOND, YEAR } from '@revoke.cash/core/utils/time';
import ControlsSection from 'components/allowances/controls/ControlsSection';
import ControlsWrapper from 'components/allowances/controls/ControlsWrapper';
import Button from 'components/common/Button';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useRevoke } from 'lib/hooks/ethereum/useRevoke';
import { timeago } from 'lib/i18n/timeago';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  allowance: TokenAllowanceData;
  onUpdate: OnUpdate;
  timeMachineTimestamp?: number;
}

const AllowanceCell = ({ allowance, onUpdate, timeMachineTimestamp }: Props) => {
  const t = useTranslations();
  const locale = useLocale();
  const [editing, setEditing] = useState<boolean>();
  const { update } = useRevoke(allowance, onUpdate);
  const { i18nKey, amount, tokenId, symbol } = getAllowanceI18nValues(allowance);

  const classes = twMerge('flex items-center gap-2', ['ru', 'es'].includes(locale) ? 'w-48' : 'w-40');

  if (editing) {
    return (
      <div className={classes}>
        <ControlsSection allowance={allowance} update={update} reset={() => setEditing(false)} />
      </div>
    );
  }

  const inTime = formatPermit2Expiration(allowance, locale, timeMachineTimestamp);

  return (
    <div className={classes}>
      <div className="flex flex-col justify-start items-start truncate">
        <div className="w-full truncate">{t(i18nKey, { amount, tokenId, symbol } as any)}</div>
        {inTime ? (
          <WithHoverTooltip tooltip={t('address.tooltips.permit2_expiration', { inTime })}>
            <div className="flex items-center gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {t('address.permit2.expiration', { inTime })}
            </div>
          </WithHoverTooltip>
        ) : null}
      </div>
      {isErc20Allowance(allowance.payload) && timeMachineTimestamp === undefined && (
        <ControlsWrapper address={allowance.owner}>
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

const formatPermit2Expiration = (allowance: TokenAllowanceData, locale: string, relativeTimestamp?: number) => {
  if (allowance.payload.type !== AllowanceType.PERMIT2) return null;
  const now = relativeTimestamp ? relativeTimestamp * SECOND : Date.now();
  const expiration = Math.min(allowance.payload.expiration * SECOND, now + 1000 * YEAR + 1 * DAY);
  return timeago.format(expiration, locale, { relativeDate: now });
};
