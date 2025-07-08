import { useQuery } from '@tanstack/react-query';
import { ERC20_ABI, ERC721_ABI } from 'lib/abis';
import blocksDB from 'lib/databases/blocks';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { deduplicateArray } from 'lib/utils';
import { createViemPublicClientForChain } from 'lib/utils/chains';
import type { ApprovalTokenEvent } from 'lib/utils/events';
import { TokenEventType } from 'lib/utils/events';
import { getTokenMetadata } from 'lib/utils/tokens';
import { useMemo } from 'react';
import { useEvents } from './events/useEvents';

const getAbiFromEventType = (eventType: TokenEventType) => {
  switch (eventType) {
    case TokenEventType.APPROVAL_ERC20:
    case TokenEventType.PERMIT2:
      return ERC20_ABI;
    case TokenEventType.APPROVAL_ERC721:
    case TokenEventType.APPROVAL_FOR_ALL:
      return ERC721_ABI;
    default:
      return ERC20_ABI;
  }
};

export const useApprovalHistory = () => {
  const { address, selectedChainId } = useAddressPageContext();
  const { events, isLoading: eventsLoading, error: eventsError } = useEvents(address, selectedChainId);

  const approvalEvents = useMemo(() => {
    if (!events) return [];

    return events.filter((event): event is ApprovalTokenEvent => {
      return [
        TokenEventType.APPROVAL_ERC20,
        TokenEventType.APPROVAL_ERC721,
        TokenEventType.APPROVAL_FOR_ALL,
        TokenEventType.PERMIT2,
      ].includes(event.type);
    });
  }, [events]);

  const queryKey = useMemo(() => {
    const serializable = approvalEvents.map((event) => ({
      type: event.type,
      token: event.token,
      blockNumber: event.time.blockNumber,
      transactionHash: event.time.transactionHash,
      spender: event.payload.spender,
    }));
    return ['approvalHistoryWithTimestamps', address, selectedChainId, serializable];
  }, [approvalEvents, address, selectedChainId]);
  const {
    data: approvalHistory,
    isLoading: timestampsLoading,
    error: timestampsError,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!approvalEvents.length) return [];

      const publicClient = createViemPublicClientForChain(selectedChainId);

      const eventsWithTimestamps = await Promise.all(
        approvalEvents.map(async (event) => {
          if (event.time.timestamp) {
            return event;
          }

          const completeTimeLog = await blocksDB.getTimeLog(publicClient, event.time);
          return { ...event, time: completeTimeLog };
        }),
      );

      const uniqueTokens = deduplicateArray(eventsWithTimestamps, (event) => event.token).map((event) => ({
        address: event.token,
        eventType: event.type,
      }));

      const metadataMap = new Map();
      await Promise.all(
        uniqueTokens.map(async ({ address, eventType }) => {
          try {
            const abi = getAbiFromEventType(eventType);
            const contract = { address, abi, publicClient } as const;
            const metadata = await getTokenMetadata(contract as any, selectedChainId);
            metadataMap.set(address, metadata);
          } catch (error) {
            console.warn(`Failed to fetch metadata for token ${address}:`, error);
            metadataMap.set(address, null);
          }
        }),
      );

      const eventsWithMetadata = eventsWithTimestamps.map((event) => ({
        ...event,
        metadata: metadataMap.get(event.token),
      }));

      return eventsWithMetadata.sort((a, b) => {
        const timestampA = a.time.timestamp ?? 0;
        const timestampB = b.time.timestamp ?? 0;
        return timestampB - timestampA;
      });
    },
    enabled: !!approvalEvents.length && !eventsLoading,
    staleTime: 1000 * 60 * 60,
  });

  return {
    approvalHistory: approvalHistory ?? [],
    isLoading: eventsLoading || timestampsLoading,
    error: eventsError || timestampsError,
  };
};
