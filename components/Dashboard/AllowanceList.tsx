import Allowance from 'components/Dashboard/Allowance';
import { isERC20Allowance, ITokenAllowance, TokenData } from 'lib/interfaces';

interface Props {
  token: TokenData;
  allowances: ITokenAllowance[];
  onRevoke: (allowance: ITokenAllowance) => void;
}

function AllowanceList({ token, allowances, onRevoke }: Props) {
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
            onRevoke={onRevoke}
          />
        ))
      )}
    </div>
  );
}

export default AllowanceList;
