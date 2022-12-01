import type { Log } from '@ethersproject/abstract-provider';
import Error from 'components/common/Error';
import { useAppContext } from 'lib/hooks/useAppContext';
import { useEthereum } from 'lib/hooks/useEthereum';
import type { AllowanceData } from 'lib/interfaces';
import { getAllowancesForAddress } from 'lib/utils/allowances';
import { hasZeroBalance, isSpamToken } from 'lib/utils/tokens';
import { useAsync } from 'react-async-hook';
import ClipLoader from 'react-spinners/ClipLoader';

interface Props {
  transferEvents: Log[];
  approvalEvents: Log[];
  approvalForAllEvents: Log[];
}

const AllowanceTable = ({ transferEvents, approvalEvents, approvalForAllEvents }: Props) => {
  const { readProvider } = useEthereum();
  const { inputAddress, tokenMapping, settings } = useAppContext();

  const {
    result: allowances = [],
    loading,
    error,
  } = useAsync<AllowanceData[]>(async () => {
    return getAllowancesForAddress(
      inputAddress,
      transferEvents,
      approvalEvents,
      approvalForAllEvents,
      readProvider,
      tokenMapping
    );
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center">
        <ClipLoader size={40} color={'#000'} loading={loading} />
      </div>
    );
  }

  if (error) return <Error error={error} />;

  const filteredAllowances = allowances
    .filter((allowance) => !isSpamToken({ symbol: allowance.symbol }))
    .filter((allowance) => settings.includeUnverifiedTokens || allowance.verified)
    .filter((allowance) => settings.includeTokensWithoutBalances || !hasZeroBalance(allowance))
    .filter((allowance) => settings.includeTokensWithoutAllowances || allowance.spender);

  return (
    <div>
      {filteredAllowances.length}
      {filteredAllowances.map((allowance) => (
        <div className="flex gap-2">
          <div>{allowance.symbol}</div>
          {/* <div>{allowance.amount}</div> */}
          <div>{allowance.spender}</div>
        </div>
      ))}
    </div>
  );
};

export default AllowanceTable;
