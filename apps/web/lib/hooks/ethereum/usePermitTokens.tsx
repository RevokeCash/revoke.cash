import { type ResolvedTimeLog, TokenEventType } from '@revoke.cash/core/events';
import {
  createTokenContract,
  getTokenMetadata,
  hasSupportForPermit,
  hasZeroBalance,
  isErc721Contract,
  type PermitTokenData,
} from '@revoke.cash/core/tokens';
import { deduplicateArray, isNullish } from '@revoke.cash/core/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLastCancelled } from 'lib/allowances/permit';
import type { OnCancel } from 'lib/types';
import { useLayoutEffect, useMemo, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { useAddressEvents, useAddressPageContext } from '../page-context/AddressPageContext';

// TODO: this is currently not working great, since we're no longer getting transfer events
// We should decide to either completely cut this feature, to accept the trade-off of not having all tokens in there,
// or change the UI into something else so that we don't need to fetch all tokens
export const usePermitTokens = () => {
  const [permitTokens, setPermitTokens] = useState<PermitTokenData[]>();
  const queryClient = useQueryClient();

  const { selectedChainId } = useAddressPageContext();
  const { events } = useAddressEvents();
  const publicClient = usePublicClient({ chainId: selectedChainId })!;

  const candidateTokenEvents = useMemo(() => {
    if (!events) return undefined;

    // The events array is already narrowed server-side to "approved tokens": Approvals are
    // returned for every approved (token, spender) pair, and Transfer events only for tokens
    // the user has at least one approval event for.
    // TODO: think about a solution for this
    const filteredEvents = events.filter((event) => {
      // Permit only applies to ERC20 tokens
      if (event.type !== TokenEventType.TRANSFER_ERC20 && event.type !== TokenEventType.APPROVAL_ERC20) return false;

      // Exclude transfer-FROM events since they likely indicate spam if that's the only event type
      if (event.type === TokenEventType.TRANSFER_ERC20 && event.owner === event.payload.from) return false;

      return true;
    });

    return deduplicateArray(filteredEvents, (event) => `${event.chainId}-${event.token}`);
  }, [events]);

  const {
    data,
    error,
    isLoading: isQueryLoading,
  } = useQuery({
    queryKey: ['permitTokens', selectedChainId, candidateTokenEvents?.map((e) => e.token)],
    queryFn: async () => {
      // Build a metadata map from enriched events (already fetched during enrichment)
      const enrichedMetadataMap = new Map(events!.map((event) => [event.token, event.metadata]));

      const tokens = await Promise.all(
        candidateTokenEvents!.map(async (event) => {
          const contract = createTokenContract(event, publicClient);
          if (!contract || isErc721Contract(contract)) return undefined;

          try {
            // 1. balanceOf (1 RPC) — filters zero-balance tokens before costlier checks
            const balance = await contract.publicClient.readContract({
              ...contract,
              functionName: 'balanceOf',
              args: [event.owner],
            });
            if (balance === 0n) return undefined;

            // 2. hasSupportForPermit (2 RPCs) — filters tokens without EIP-2612
            if (!(await hasSupportForPermit(contract))) return undefined;

            // 3. Metadata (0 RPCs from enriched map, 2-3 RPCs fallback) — only for tokens that pass both checks
            const metadata =
              enrichedMetadataMap.get(event.token) ?? (await getTokenMetadata(contract, selectedChainId));

            // Re-check with decimals in case of dust amounts
            if (hasZeroBalance(balance, metadata.decimals)) return undefined;

            const lastCancelled = await getLastCancelled(events!, contract);

            return { contract, metadata, chainId: selectedChainId, owner: event.owner, balance, lastCancelled };
          } catch {
            return undefined;
          }
        }),
      );

      return tokens.filter((token) => !isNullish(token));
    },
    enabled: !isNullish(candidateTokenEvents) && !isNullish(events),
    staleTime: Number.POSITIVE_INFINITY,
  });

  useLayoutEffect(() => {
    if (data) {
      setPermitTokens(data);
    }
  }, [data]);

  const isLoading = (isQueryLoading || !permitTokens) && !error;

  const onCancel: OnCancel<PermitTokenData> = async (token: PermitTokenData, lastCancelled: ResolvedTimeLog) => {
    await queryClient.invalidateQueries({
      queryKey: ['blockNumber', selectedChainId],
      refetchType: 'none',
    });

    const permitTokenEquals = (a: PermitTokenData, b: PermitTokenData) => {
      return a.contract.address === b.contract.address && a.chainId === b.chainId;
    };

    setPermitTokens((previousPermitTokens) => {
      return previousPermitTokens!.map((other) => {
        if (!permitTokenEquals(other, token)) return other;

        const newPermitTokenData = { ...other, lastCancelled };
        return newPermitTokenData;
      });
    });
  };

  return { permitTokens, isLoading, error, onCancel };
};
