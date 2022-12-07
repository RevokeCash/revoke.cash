import type { AllowanceData } from 'lib/interfaces';
import { getAllowanceI18nValues } from 'lib/utils/allowances';
import { classNames } from 'lib/utils/styles';
import Trans from 'next-translate/Trans';

interface Props {
  allowance: AllowanceData;
}

const AllowanceCell = ({ allowance }: Props) => {
  const { i18nKey, amount, tokenId, symbol } = getAllowanceI18nValues(allowance);

  return (
    <div className={classNames(!allowance.spender && 'text-gray-400')}>
      <Trans i18nKey={i18nKey} values={{ amount, tokenId, symbol }} />
    </div>
  );
};

export default AllowanceCell;
