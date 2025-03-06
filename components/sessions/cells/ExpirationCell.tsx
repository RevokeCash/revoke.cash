import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { formatDateNormalised } from 'lib/utils/time';
import { useLocale } from 'next-intl';
import TimeAgo from 'timeago-react';

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
