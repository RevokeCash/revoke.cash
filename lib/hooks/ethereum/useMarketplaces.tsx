import { ChainId } from '@revoke.cash/chains';
import { Contract, Signer } from 'ethers';
import { BLUR, OPENSEA_SEAPORT } from 'lib/abis';
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
        ChainId.OPMainnet,
        ChainId.OptimismGoerliTestnet,
        ChainId.ArbitrumOne,
        ChainId.ArbitrumGoerli,
        ChainId.ArbitrumNova,
        ChainId.BaseGoerliTestnet,
        ChainId['AvalancheC-Chain'],
        ChainId.AvalancheFujiTestnet,
        ChainId.Gnosis,
        ChainId.GnosisChiadoTestnet,
        ChainId.BNBSmartChainMainnet,
        ChainId.BNBSmartChainTestnet,
        ChainId.KlaytnMainnetCypress,
        ChainId.KlaytnTestnetBaobab,
        ChainId.Moonbeam,
        ChainId.Moonriver,
        ChainId.Canto,
        ChainId.FantomOpera,
        ChainId.CeloMainnet,
      ],
      cancelSignatures: async (signer: Signer) => {
        const seaportContract = new Contract('0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC', OPENSEA_SEAPORT, signer);
        const transactionPromise = seaportContract.functions.incrementCounter();
        return handleTransaction(transactionPromise, TransactionType.OTHER);
      },
    },
    {
      name: 'Blur',
      logo: '/assets/images/vendor/blur.png',
      chains: [ChainId.EthereumMainnet],
      cancelSignatures: async (signer: Signer) => {
        const blurContract = new Contract('0x000000000000Ad05Ccc4F10045630fb830B95127', BLUR, signer);
        const transactionPromise = blurContract.functions.incrementNonce();
        return handleTransaction(transactionPromise, TransactionType.OTHER);
      },
    },
  ];

  const marketplaces = useMemo(
    () => allMarketplaces.filter((marketplace) => marketplace.chains.includes(chainId)),
    [chainId],
  );

  return marketplaces;
};
