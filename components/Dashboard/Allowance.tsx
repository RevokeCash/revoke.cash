import AllowanceControls from 'components/common/AllowanceControls';
import { useAppContext } from 'lib/hooks/useAppContext';
import { useEthereum } from 'lib/hooks/useEthereum';
import { useRevoke } from 'lib/hooks/useRevoke';
import type { ITokenAllowance, TokenData } from 'lib/interfaces';
import { addressToAppName } from 'lib/utils/whois';
import { useAsync } from 'react-async-hook';
import { ClipLoader } from 'react-spinners';
import AllowanceDisplay from './AllowanceDisplay';

interface Props {
  token: TokenData;
  allowance: ITokenAllowance;
  onRevoke: (allowance: ITokenAllowance) => void;
}

const Allowance = ({ allowance, token, onRevoke }: Props) => {
  const { selectedChainId } = useEthereum();
  const { openSeaProxyAddress } = useAppContext();
  const { revoke, update, updatedAmount } = useRevoke(token, allowance, onRevoke);
  const { result: spenderName, loading } = useAsync(
    () => addressToAppName(allowance.spender, selectedChainId, openSeaProxyAddress),
    []
  );

  if (loading) {
    return (
      <div>
        <ClipLoader size={10} color={'#000'} loading={loading} />
      </div>
    );
  }

  return (
    <div className="text-sm flex justify-between gap-2 py-1">
      <AllowanceDisplay token={token} allowance={allowance} updatedAmount={updatedAmount} spenderName={spenderName} />
      <AllowanceControls revoke={revoke} update={update} id={`${token.contract.address}-${allowance.spender}`} />
    </div>
  );

  // return (
  //   <Form inline className="Allowance">
  //     <AllowanceDisplay token={token} allowance={allowance} updatedAmount={updatedAmount} spenderName={spenderName} />
  //     <AllowanceControls revoke={revoke} update={update} id={`${token.contract.address}-${allowance.spender}`} />
  //   </Form>
  // );
};

export default Allowance;
