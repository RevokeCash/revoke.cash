'use client';

import Button from 'components/common/Button';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useTranslations } from 'next-intl';

const Eip7702RevokeCell = () => {
  const t = useTranslations();

  return (
    <div className="flex justify-end w-28 mr-0 mx-auto">
      <WithHoverTooltip tooltip={t('address.delegations.tooltips.eip7702_revoke')}>
        <Button disabled={true} style="secondary" size="sm">
          {t('common.buttons.revoke')}
        </Button>
      </WithHoverTooltip>
    </div>
  );
};

export default Eip7702RevokeCell;
