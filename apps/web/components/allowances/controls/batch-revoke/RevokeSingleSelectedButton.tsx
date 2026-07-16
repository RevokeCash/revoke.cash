import type { TokenAllowanceData } from '@revoke.cash/core/allowances';
import type { Table } from '@tanstack/react-table';
import Button from 'components/common/Button';
import { useRevoke } from 'lib/hooks/ethereum/useRevoke';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { useTranslations } from 'next-intl';
import ControlsWrapper from '../ControlsWrapper';

interface Props {
  table: Table<TokenAllowanceData>;
  allowance: TokenAllowanceData;
}

const RevokeSingleSelectedButton = ({ table, allowance }: Props) => {
  const t = useTranslations();
  const { address } = useAddress();

  const { revoke, isRevoking } = useRevoke(allowance, table.options.meta!.onUpdate);

  return (
    <ControlsWrapper address={address} overrideDisabled={false}>
      {(disabled) => (
        <div className="w-fit">
          <Button style="primary" size="sm" disabled={disabled} onClick={revoke} loading={isRevoking}>
            {isRevoking ? t('common.buttons.revoking') : t('common.buttons.revoke_selected')}
          </Button>
        </div>
      )}
    </ControlsWrapper>
  );
};

export default RevokeSingleSelectedButton;
