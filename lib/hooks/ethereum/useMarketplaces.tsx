import { ChainId } from 'eth-chains';
import { Contract, Signer } from 'ethers';
import { OPENSEA_SEAPORT } from 'lib/abis';
import { Marketplace, TransactionType } from 'lib/interfaces';
import { useMemo } from 'react';
import { useHandleTransaction } from './useHandleTransaction';

export const useMarketplaces = (chainId: number) => {
  const handleTransaction = useHandleTransaction();
  const allMarketplaces: Marketplace[] = [
    {
      name: 'OpenSea',
      logo: '/assets/images/vendor/opensea.svg',
      chains: [
        // See https://github.com/ProjectOpenSea/seaport
        ChainId.EthereumMainnet,
        ChainId.Goerli,
        ChainId.Sepolia,
        ChainId.PolygonMainnet,
        ChainId.Mumbai,
        ChainId.KlaytnMainnetCypress,
        ChainId.KlaytnTestnetBaobab,
        ChainId.Optimism,
        ChainId.OptimisticEthereumTestnetGoerli,
        ChainId.ArbitrumOne,
        421613, // Arbitrum Goerli
        42170, // Arbitrum Nova
        ChainId['AvalancheC-Chain'],
        ChainId.AvalancheFujiTestnet,
        ChainId.Gnosis,
        ChainId.BinanceSmartChainMainnet,
        ChainId.BinanceSmartChainTestnet,
      ],
      cancelSignatures: async (signer: Signer) => {
        const seaportContract = new Contract('0x00000000000001ad428e4906aE43D8F9852d0dD6', OPENSEA_SEAPORT, signer);
        const transactionPromise = seaportContract.functions.incrementCounter();
        return handleTransaction(transactionPromise, TransactionType.OTHER);
      },
    },
  ];

  const marketplaces = useMemo(
    () => allMarketplaces.filter((marketplace) => marketplace.chains.includes(chainId)),
    [chainId]
  );

  return marketplaces;
};
