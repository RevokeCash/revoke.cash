import { ChainId } from '@revoke.cash/chains';
import { BLUR_ABI, OPENSEA_SEAPORT_ABI } from 'lib/abis';
import { Marketplace, TransactionType } from 'lib/interfaces';
import { getWalletAddress } from 'lib/utils';
import { useMemo } from 'react';
import { WalletClient } from 'viem';
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
      filterAddress: '0x1E0049783F008A0085193E00003D00cd54003c71',
      cancelSignatures: async (walletClient: WalletClient) => {
        const transactionPromise = walletClient.writeContract({
          address: '0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC',
          abi: OPENSEA_SEAPORT_ABI,
          account: await getWalletAddress(walletClient),
          functionName: 'incrementCounter',
          chain: walletClient.chain,
          value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
        });

        return handleTransaction(transactionPromise, TransactionType.OTHER);
      },
    },
    {
      name: 'Blur',
      logo: '/assets/images/vendor/blur.png',
      chains: [ChainId.EthereumMainnet],
      filterAddress: '0x2f18F339620a63e43f0839Eeb18D7de1e1Be4DfB',
      cancelSignatures: async (walletClient: WalletClient) => {
        const transactionPromise = walletClient.writeContract({
          address: '0x000000000000Ad05Ccc4F10045630fb830B95127',
          abi: BLUR_ABI,
          account: await getWalletAddress(walletClient),
          functionName: 'incrementNonce',
          chain: walletClient.chain,
          value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
        });

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
