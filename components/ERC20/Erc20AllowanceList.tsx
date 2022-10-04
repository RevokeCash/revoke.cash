import { Erc20TokenData, IERC20Allowance } from 'lib/interfaces';
import React from 'react';
import Erc20Allowance from './Erc20Allowance';

interface Props {
  inputAddress: string;
  token: Erc20TokenData;
  allowances: IERC20Allowance[];
  onRevoke: (spender: string) => void;
}

function Erc20AllowanceList({ inputAddress, token, onRevoke, allowances }: Props) {
  return (
    <div className="AllowanceList">
      {allowances.length === 0 ? (
        <div className="Allowance">No allowances</div>
      ) : (
        allowances.map((allowance, i) => (
          <Erc20Allowance
            key={i}
            spender={allowance.spender}
            allowance={allowance.allowance}
            inputAddress={inputAddress}
            token={token}
            onRevoke={onRevoke}
          />
        ))
      )}
    </div>
  );
}

export default Erc20AllowanceList;
