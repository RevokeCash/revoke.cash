import React from 'react'
import { providers, Signer } from 'ethers'
import { Erc20TokenData } from '../common/interfaces'
import { Allowance } from './interfaces'
import Erc20Allowance from './Erc20Allowance'

interface Props {
  signer?: Signer
  provider: providers.Provider
  inputAddress: string
  signerAddress: string
  chainId: number
  token: Erc20TokenData
  allowances: Allowance[];
  onRevoke: (spender: string) => void;
}

function Erc20AllowanceList({ signer, provider, inputAddress, signerAddress, chainId, token, onRevoke, allowances }: Props) {
  return (
    <div className="AllowanceList">
      {
        allowances.length === 0
          ? <div className="Allowance">No allowances</div>
          : allowances.map((allowance, i) => (
            <Erc20Allowance
              key={i}
              signer={signer}
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
