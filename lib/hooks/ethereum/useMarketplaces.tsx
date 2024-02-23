import { ChainId } from '@revoke.cash/chains';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BLUR_ABI, OPENSEA_SEAPORT_ABI } from 'lib/abis';
import eventsDB from 'lib/databases/events';
import { Marketplace, MarketplaceConfig, TransactionType } from 'lib/interfaces';
import ky from 'lib/ky';
import { getLogsProvider } from 'lib/providers';
import { addressToTopic, getLogTimestamp, getWalletAddress, logSorterChronological } from 'lib/utils';
import { createViemPublicClientForChain } from 'lib/utils/chains';
import { mapAsync } from 'lib/utils/promises';
import { MINUTE } from 'lib/utils/time';
import { Address, WalletClient, getAbiItem, getEventSelector } from 'viem';
import { fetchBlockNumber } from 'wagmi/actions';
import { useHandleTransaction } from './useHandleTransaction';

export const useMarketplaces = (chainId: number, address: Address) => {
  const handleTransaction = useHandleTransaction();
  const queryClient = useQueryClient();
  const publicClient = createViemPublicClientForChain(chainId);

  const allMarketplaces: MarketplaceConfig[] = [
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
  const marketplaces = useQuery<Marketplace[]>({
    queryKey: ['marketplaces', chainId, address],
    queryFn: async () => {
      const filtered = allMarketplaces.filter((marketplace) => marketplace.chains.includes(chainId));

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

  return marketplaces;
};
