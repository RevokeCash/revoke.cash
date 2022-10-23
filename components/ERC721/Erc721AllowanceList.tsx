import { Erc721TokenData, IERC721Allowance } from 'lib/interfaces';
import Erc721Allowance from './Erc721Allowance';

interface Props {
  token: Erc721TokenData;
  allowances: IERC721Allowance[];
  inputAddress: string;
  openSeaProxyAddress?: string;
  onRevoke: (allowance: IERC721Allowance) => void;
}

function Erc721AllowanceList({ token, allowances, inputAddress, openSeaProxyAddress, onRevoke }: Props) {
  return (
    <div className="AllowanceList">
      {allowances.length === 0 ? (
        <div className="Allowance">No allowances</div>
      ) : (
        allowances.map((allowance) => (
          <Erc721Allowance
            key={`${allowance.tokenId}-${allowance.spender}`}
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

export default Erc721AllowanceList;
