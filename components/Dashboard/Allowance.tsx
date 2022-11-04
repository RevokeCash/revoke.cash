import AllowanceControls from 'components/common/AllowanceControls';
import { useEthereum } from 'lib/hooks/useEthereum';
import { useRevoke } from 'lib/hooks/useRevoke';
import { ITokenAllowance, TokenData } from 'lib/interfaces';
import { addressToAppName } from 'lib/utils/whois';
import { useAsync } from 'react-async-hook';
import { Form } from 'react-bootstrap';
import { ClipLoader } from 'react-spinners';
import AllowanceDisplay from './AllowanceDisplay';

interface Props {
  inputAddress: string;
  token: TokenData;
  allowance: ITokenAllowance;
  onRevoke: (allowance: ITokenAllowance) => void;
  openSeaProxyAddress?: string;
}

function Allowance({ allowance, inputAddress, token, onRevoke, openSeaProxyAddress }: Props) {
  const { selectedChainId } = useEthereum();
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
    <Form inline className="Allowance">
      <AllowanceDisplay token={token} allowance={allowance} updatedAmount={updatedAmount} spenderName={spenderName} />
      <AllowanceControls
        revoke={revoke}
        update={update}
        inputAddress={inputAddress}
        id={`${token.contract.address}-${allowance.spender}`}
      />
    </Form>
  );
}

export default Allowance;
