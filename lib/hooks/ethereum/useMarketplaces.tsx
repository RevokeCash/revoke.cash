import { ChainId } from '@revoke.cash/chains';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BLUR_ABI, OPENSEA_SEAPORT_ABI } from 'lib/abis';
import blocksDB from 'lib/databases/blocks';
import eventsDB from 'lib/databases/events';
import type { Marketplace, MarketplaceConfig, OnCancel } from 'lib/interfaces';
import { getLogsProvider } from 'lib/providers';
import { addressToTopic, apiLogin, getWalletAddress, isNullish, logSorterChronological } from 'lib/utils';
import { createViemPublicClientForChain } from 'lib/utils/chains';
import type { TimeLog } from 'lib/utils/events';
import { mapAsync } from 'lib/utils/promises';
import { MINUTE } from 'lib/utils/time';
import { useLayoutEffect, useState } from 'react';
import { type Address, type Hash, type WalletClient, getAbiItem, toEventSelector } from 'viem';
import { useAddressAllowances, useAddressPageContext } from '../page-context/AddressPageContext';

export const useMarketplaces = () => {
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);

  const { selectedChainId, address } = useAddressPageContext();
  const { allowances, isLoading: isAllowancesLoading, error: allowancesError } = useAddressAllowances();

  const queryClient = useQueryClient();

  const publicClient = createViemPublicClientForChain(selectedChainId);

  const ALL_MARKETPLACES: MarketplaceConfig[] = [
    {
      name: 'OpenSea',
      logo: '/assets/images/vendor/opensea.svg',
      chains: [
        // See https://github.com/ProjectOpenSea/seaport
        ChainId.EthereumMainnet,
        ChainId.EthereumSepolia,
        ChainId.PolygonMainnet,
        ChainId.Amoy,
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
        ChainId.KaiaMainnet,
        ChainId.KaiaKairosTestnet,
        ChainId.Moonbeam,
        ChainId.Moonriver,
        ChainId.Canto,
        ChainId.FantomOpera,
        ChainId.CeloMainnet,
        ChainId.Zora,
        ChainId.ZoraSepoliaTestnet,
      ],
      approvalFilterAddress: '0x1E0049783F008A0085193E00003D00cd54003c71',
      cancelSignatures: async (walletClient: WalletClient): Promise<Hash> => {
        return walletClient.writeContract({
          address: '0x0000000000000068F116a894984e2DB1123eB395',
          abi: OPENSEA_SEAPORT_ABI,
          account: await getWalletAddress(walletClient),
          functionName: 'incrementCounter',
          chain: walletClient.chain,
          value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
        });
      },
      getFilter: (address: Address) => ({
        address: '0x0000000000000068F116a894984e2DB1123eB395',
        topics: [
          toEventSelector(getAbiItem({ abi: OPENSEA_SEAPORT_ABI, name: 'CounterIncremented' })),
          addressToTopic(address),
        ],
      }),
    },
    {
      name: 'Blur',
      logo: '/assets/images/vendor/blur.png',
      chains: [ChainId.EthereumMainnet],
      approvalFilterAddress: '0x2f18F339620a63e43f0839Eeb18D7de1e1Be4DfB',
      cancelSignatures: async (walletClient: WalletClient): Promise<Hash> => {
        return walletClient.writeContract({
          address: '0xb2ecfE4E4D61f8790bbb9DE2D1259B9e2410CEA5',
          abi: BLUR_ABI,
          account: await getWalletAddress(walletClient),
          functionName: 'incrementNonce',
          chain: walletClient.chain,
          value: 0n as any as never, // Workaround for Gnosis Safe, TODO: remove when fixed
        });
      },
      getFilter: (address: Address) => ({
        address: '0xb2ecfE4E4D61f8790bbb9DE2D1259B9e2410CEA5',
        topics: [toEventSelector(getAbiItem({ abi: BLUR_ABI, name: 'NonceIncremented' })), addressToTopic(address)],
      }),
    },
  ];

  // TODO: This is pretty ugly with all the queryClient.ensureQueryData calls, so we should try to improve this down
  // the line. The issue is that we want to ensure that an error in one of the marketplaces also stops the others from
  // loading, so that it displays a "global" table error, rather than a per-marketplace error.
  const {
    data,
    isLoading: isMarketplacesLoading,
    error: marketplacesError,
  } = useQuery<Marketplace[]>({
    queryKey: ['marketplaces', selectedChainId, address],
    queryFn: async () => {
      const filtered = ALL_MARKETPLACES.filter((marketplace) => marketplace.chains.includes(selectedChainId));

      const blockNumber = await queryClient.ensureQueryData({
        queryKey: ['blockNumber', selectedChainId],
        queryFn: async () => createViemPublicClientForChain(selectedChainId).getBlockNumber().then(Number),
        // Don't refresh the block number too often to avoid refreshing events too often, to avoid backend API rate limiting
        gcTime: 1 * MINUTE,
        staleTime: 1 * MINUTE,
      });

      const isLoggedIn = await apiLogin();

      const marketplaces = await mapAsync(filtered, async (marketplace) => {
        const filter = { ...marketplace.getFilter(address), fromBlock: 0, toBlock: blockNumber };
        const logs = await queryClient.ensureQueryData({
          queryKey: ['logs', filter, selectedChainId, isLoggedIn],
          queryFn: async () => eventsDB.getLogs(getLogsProvider(selectedChainId), filter, selectedChainId),
          // The same filter should always return the same logs
          staleTime: Number.POSITIVE_INFINITY,
        });

        const lastCancelledLog = logs?.sort(logSorterChronological)?.at(-1);
        const lastCancelled = lastCancelledLog ? await blocksDB.getTimeLog(publicClient, lastCancelledLog) : undefined;

        return {
          ...marketplace,
          chainId: selectedChainId,
          lastCancelled,
          allowances: allowances!.filter(
            (allowance) => allowance.payload?.spender === marketplace.approvalFilterAddress,
          ),
        };
      });

      return marketplaces.filter((marketplace) => marketplace.allowances.length > 0);
    },
    // TODO: This is a hack to ensure that the allowances are already loaded so we can filter on them.
    // But most of these calls could easily be done in parallel, so we should try to improve this down the line.
    enabled: !isAllowancesLoading && isNullish(allowancesError) && !isNullish(allowances),
  });

  useLayoutEffect(() => {
    if (data) {
      setMarketplaces(data);
    }
  }, [data]);

  const onCancel: OnCancel<Marketplace> = async (marketplace: Marketplace, lastCancelled: TimeLog) => {
    await queryClient.invalidateQueries({
      queryKey: ['blockNumber', selectedChainId],
      refetchType: 'none',
    });

    await queryClient.invalidateQueries({
      queryKey: ['marketplaces', selectedChainId, address],
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

  const error = allowancesError || marketplacesError;
  const isLoading = (isAllowancesLoading || isMarketplacesLoading || !marketplaces) && !error;

  return { marketplaces, isLoading, error, onCancel };
};
