import Allowance from 'components/Dashboard/Allowance';
import { isERC20Allowance, ITokenAllowance, TokenData } from 'lib/interfaces';

interface Props {
  token: TokenData;
  allowances: ITokenAllowance[];
  inputAddress: string;
  openSeaProxyAddress?: string;
  onRevoke: (allowance: ITokenAllowance) => void;
}

function AllowanceList({ token, allowances, inputAddress, openSeaProxyAddress, onRevoke }: Props) {
  return (
    <div className="AllowanceList">
      {allowances.length === 0 ? (
        <div className="Allowance">No allowances</div>
      ) : (
        allowances.map((allowance) => (
          <Allowance
            key={`${allowance.spender}-${isERC20Allowance(allowance) ? allowance.amount : allowance.tokenId}`}
            token={token}
            allowance={allowance}
            inputAddress={inputAddress}
            openSeaProxyAddress={openSeaProxyAddress}
            onRevoke={onRevoke}
          />
        ))
      )}
    </div>
  );
}

export default AllowanceList;
