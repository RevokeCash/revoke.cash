import { formatDateNormalised } from '@revoke.cash/core/utils/time';
import TimeAgo from 'components/common/TimeAgo';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useLocale } from 'next-intl';

interface Props {
  expiration: bigint;
}

const ExpirationCell = ({ expiration }: Props) => {
  const expirationDate = new Date(Math.min(Number(expiration) * 1000, new Date('9999-12-31T23:59:59').getTime()));
  const locale = useLocale();

  return (
    <div className="flex justify-start py-3.5">
      <WithHoverTooltip tooltip={<TimeAgo datetime={expirationDate} locale={locale} />}>
        <div>{formatDateNormalised(expirationDate)}</div>
      </WithHoverTooltip>
    </div>
  );
};

export default ExpirationCell;
