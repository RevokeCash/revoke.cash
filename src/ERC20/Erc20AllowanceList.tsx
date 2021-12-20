import React from 'react'
import { providers } from 'ethers'
import { Erc20TokenData, Allowance } from '../common/interfaces'
import Erc20Allowance from './Erc20Allowance'

type Props = {
  provider: providers.Provider
  inputAddress: string
  signerAddress: string
  chainId: number
  token: Erc20TokenData
  allowances: Allowance[];
  onRevoke: (spender: string) => void;
}

function Erc20AllowanceList({ provider, inputAddress, signerAddress, chainId, token, onRevoke, allowances }: Props) {
  return (
    <div className="AllowanceList">
      {
        allowances.length === 0
          ? <div className="Allowance">No allowances</div>
          : allowances.map((allowance, i) => (
            <Erc20Allowance
              key={i}
              provider={provider}
              spender={allowance.spender}
              allowance={allowance.allowance}
              inputAddress={inputAddress}
              signerAddress={signerAddress}
              chainId={chainId}
              token={token}
              onRevoke={onRevoke}
            />
          ))
      }
    </div>
  )
}

export default Erc20AllowanceList
