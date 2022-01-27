import React from 'react'
import { Signer, providers } from 'ethers'
import { TokenMapping } from './common/interfaces'
import Erc20TokenList from './ERC20/Erc20TokenList'
import Erc721TokenList from './ERC721/Erc721TokenList'

interface Props {
  provider: providers.Provider
  chainId: number
  filterRegisteredTokens: boolean
  filterZeroBalances: boolean
  tokenStandard: string
  tokenMapping?: TokenMapping
  signer?: Signer
  signerAddress?: string
  inputAddress?: string
}

function TokenList({
  provider,
  chainId,
  filterRegisteredTokens,
  filterZeroBalances,
  tokenStandard,
  tokenMapping,
  signer,
  signerAddress,
  inputAddress,
}: Props) {
  if (!inputAddress) {
    return null;
  }

  if (tokenStandard === 'ERC20') {
    return (
      <Erc20TokenList
        provider={provider}
        chainId={chainId}
        signer={signer}
        signerAddress={signerAddress}
        inputAddress={inputAddress}
        filterRegisteredTokens={filterRegisteredTokens}
        filterZeroBalances={filterZeroBalances}
        tokenMapping={tokenMapping}
      />
    );
  } else {
    return (
      <Erc721TokenList
        provider={provider}
        chainId={chainId}
        signer={signer}
        signerAddress={signerAddress}
        inputAddress={inputAddress}
        filterRegisteredTokens={filterRegisteredTokens}
        filterZeroBalances={filterZeroBalances}
        tokenMapping={tokenMapping}
      />
    );
  }
}

export default TokenList
