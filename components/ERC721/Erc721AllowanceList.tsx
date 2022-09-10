import React from 'react';
import { Erc721TokenData } from '../common/interfaces';
import Erc721Allowance from './Erc721Allowance';
import { Allowance } from './interfaces';

interface Props {
  token: Erc721TokenData;
  allowances: Allowance[];
  inputAddress: string;
  openSeaProxyAddress?: string;
  onRevoke: (allowance: Allowance) => void;
}

function Erc721AllowanceList({ token, allowances, inputAddress, openSeaProxyAddress, onRevoke }: Props) {
  return (
    <div className="AllowanceList">
      {allowances.length === 0 ? (
        <div className="Allowance">No allowances</div>
      ) : (
        allowances.map((allowance, i) => (
          <Erc721Allowance
            key={i}
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
