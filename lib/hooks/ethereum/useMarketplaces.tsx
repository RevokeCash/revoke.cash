import { ChainId } from '@revoke.cash/chains';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BLUR_ABI, OPENSEA_SEAPORT_ABI } from 'lib/abis';
import eventsDB from 'lib/databases/events';
import { Marketplace, MarketplaceConfig, OnCancel, TimeLog, TransactionType } from 'lib/interfaces';
import ky from 'lib/ky';
import { getLogsProvider } from 'lib/providers';
import { addressToTopic, getLogTimestamp, getWalletAddress, logSorterChronological } from 'lib/utils';
import { createViemPublicClientForChain } from 'lib/utils/chains';
import { mapAsync } from 'lib/utils/promises';
import { MINUTE } from 'lib/utils/time';
import { useLayoutEffect, useState } from 'react';
import { Address, WalletClient, getAbiItem, getEventSelector } from 'viem';
import { fetchBlockNumber } from 'wagmi/actions';
import { useHandleTransaction } from './useHandleTransaction';

export const useMarketplaces = (chainId: number, address: Address) => {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>();
  const handleTransaction = useHandleTransaction();
  const queryClient = useQueryClient();
  const publicClient = createViemPublicClientForChain(chainId);

  const ALL_MARKETPLACES: MarketplaceConfig[] = [
    {
      name: 'OpenSea',
      logo: '/assets/images/vendor/opensea.svg',
      chains: [
        // See https://github.com/ProjectOpenSea/seaport
        ChainId.EthereumMainnet,
        ChainId.Sepolia,
        ChainId.PolygonMainnet,
        ChainId.Mumbai,
        ChainId.OPMainnet,
        ChainId.OPSepoliaTestnet,
        ChainId.ArbitrumOne,
        ChainId.ArbitrumSepolia,
        ChainId.ArbitrumNova,
        ChainId.Base,
        ChainId.BaseSepoliaTestnet,
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
        ChainId.Zora,
        ChainId.ZoraSepoliaTestnet,
      ],
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
      getFilter: (address: Address) => ({
        address: '0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC',
        topics: [
          getEventSelector(getAbiItem({ abi: OPENSEA_SEAPORT_ABI, name: 'CounterIncremented' })),
          addressToTopic(address),
        ],
      }),
    },
    {
      name: 'Blur',
      logo: '/assets/images/vendor/blur.png',
      chains: [ChainId.EthereumMainnet],
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
      getFilter: (address: Address) => ({
        address: '0x000000000000Ad05Ccc4F10045630fb830B95127',
        topics: [getEventSelector(getAbiItem({ abi: BLUR_ABI, name: 'NonceIncremented' })), addressToTopic(address)],
      }),
    },
  ];

  // TODO: This is pretty ugly with all the queryClient.ensureQueryData calls, so we should try to improve this down
  // the line. The issue is that we want to ensure that an error in one of the marketplaces also stops the others from
  // loading, so that it displays a "global" table error, rather than a per-marketplace error.
  const { data, isLoading, error } = useQuery<Marketplace[]>({
    queryKey: ['marketplaces', chainId, address],
    queryFn: async () => {
      const filtered = ALL_MARKETPLACES.filter((marketplace) => marketplace.chains.includes(chainId));

      const blockNumber = await queryClient.ensureQueryData({
        queryKey: ['blockNumber', chainId],
        queryFn: async () => fetchBlockNumber({ chainId }).then(Number),
        // Don't refresh the block number too often to avoid refreshing events too often, to avoid backend API rate limiting
        gcTime: 1 * MINUTE,
        staleTime: 1 * MINUTE,
      });

      const isLoggedIn = await ky
        .post('/api/login')
        .json<any>()
        .then((res) => !!res?.ok);

      const marketplaces = await mapAsync(filtered, async (marketplace) => {
        const filter = { ...marketplace.getFilter(address), fromBlock: 0, toBlock: blockNumber };
        const logs = await queryClient.ensureQueryData({
          queryKey: ['logs', filter, chainId, isLoggedIn],
          queryFn: async () => eventsDB.getLogs(getLogsProvider(chainId), filter, chainId),
          // The same filter should always return the same logs
          staleTime: Infinity,
        });

        const lastCancelled = logs?.sort(logSorterChronological)?.at(-1);
        const timestamp = lastCancelled ? await getLogTimestamp(publicClient, lastCancelled) : undefined;

        return {
          ...marketplace,
          chainId,
          lastCancelled: lastCancelled ? { ...lastCancelled, timestamp } : undefined,
        };
      });

      return marketplaces;
    },
  });

  useLayoutEffect(() => {
    if (data) {
      setMarketplaces(data);
    }
  }, [data]);

  const onCancel: OnCancel<Marketplace> = async (marketplace: Marketplace, lastCancelled: TimeLog) => {
    await queryClient.invalidateQueries({
      queryKey: ['blockNumber', chainId],
      refetchType: 'none',
    });

    const marketplaceEquals = (a: Marketplace, b: Marketplace) => {
      return a.name === b.name && a.chainId === b.chainId;
    };

    setMarketplaces((previousMarketplaces) => {
      return previousMarketplaces.map((other) => {
        if (!marketplaceEquals(other, marketplace)) return other;

        const newMarketplace = { ...other, lastCancelled };
        return newMarketplace;
      });
    });
  };

  return { marketplaces, isLoading: isLoading || !marketplaces, error, onCancel };
};
