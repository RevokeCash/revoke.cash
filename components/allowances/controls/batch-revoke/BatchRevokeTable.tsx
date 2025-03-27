import AssetCell from 'components/allowances/dashboard/cells/AssetCell';
import SpenderCell from 'components/allowances/dashboard/cells/SpenderCell';
import StatusCell from 'components/allowances/dashboard/cells/StatusCell';
import TransactionHashCell from 'components/allowances/dashboard/cells/TransactionHashCell';
import type { TransactionResults } from 'lib/stores/transaction-store';
import { type TokenAllowanceData, getAllowanceKey } from 'lib/utils/allowances';
import { useTranslations } from 'next-intl';

interface Props {
  selectedAllowances: TokenAllowanceData[];
  results: TransactionResults;
}

const BatchRevokeTable = ({ selectedAllowances, results }: Props) => {
  const t = useTranslations();

  return (
    <table className="w-full border-collapse">
      <thead className="sticky top-0 bg-white dark:bg-black z-50">
        <tr>
          <th className="py-2 pr-0.5">#</th>
          <th>{t('address.headers.asset')}</th>
          <th>{t('address.headers.spender')}</th>
          <th className="pr-2">{t('address.headers.status')}</th>
          <th>{t('address.headers.transaction')}</th>
        </tr>
      </thead>
      <tbody>
        {selectedAllowances.map((allowance, index) => (
          <tr key={getAllowanceKey(allowance)}>
            <td className="text-zinc-500">{index + 1}</td>
            <td className="py-1">
              <AssetCell asset={allowance} />
            </td>
            <td>
              <SpenderCell allowance={allowance} />
            </td>
            <td>
              <StatusCell
                status={results[getAllowanceKey(allowance)]?.status}
                reason={results[getAllowanceKey(allowance)]?.error}
              />
            </td>
            <td>
              <TransactionHashCell
                chainId={allowance.chainId}
                transactionHash={results[getAllowanceKey(allowance)]?.transactionHash}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default BatchRevokeTable;
