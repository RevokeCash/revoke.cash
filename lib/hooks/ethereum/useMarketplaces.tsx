import { ChainId } from 'eth-chains';
import { Contract, Signer } from 'ethers';
import { BLUR, OPENSEA_SEAPORT } from 'lib/abis';
import { Marketplace, TransactionType } from 'lib/interfaces';
import useTranslation from 'next-translate/useTranslation';
import { useMemo } from 'react';
import { useHandleTransaction } from './useHandleTransaction';

export const useMarketplaces = (chainId: number) => {
  const { t } = useTranslation();
  const handleTransaction = useHandleTransaction();

  const allMarketplaces: Marketplace[] = [
    {
      name: 'OpenSea',
      logo: '/assets/images/vendor/opensea.svg',
      tooltip: t('address:tooltips.marketplace_listings', { marketplace: 'OpenSea' }),
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
    {
      name: 'Blur',
      logo: '/assets/images/vendor/blur.png',
      tooltip: t('address:tooltips.marketplace_listings', { marketplace: 'Blur' }),
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
    [chainId]
  );

  return marketplaces;
};
