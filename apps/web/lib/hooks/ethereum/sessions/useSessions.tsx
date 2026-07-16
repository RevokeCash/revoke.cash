import { getSessionEvents } from '@revoke.cash/core/chains/events';
import { getSessionsFromEvents, type Session } from '@revoke.cash/core/sessions';
import { isNullish } from '@revoke.cash/core/utils';
import { useQuery } from '@tanstack/react-query';
import { getLogsProvider } from 'lib/providers';
import { useLayoutEffect, useState } from 'react';
import type { Address } from 'viem';
import { usePublicClient } from 'wagmi';

export const useSessions = (address: Address, chainId: number) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const publicClient = usePublicClient({ chainId })!;

  const { data, isLoading, error } = useQuery({
    queryKey: ['sessions', chainId, address],
    queryFn: async () => {
      const events = await getSessionEvents(chainId, address, getLogsProvider(chainId));
      const sessions = await getSessionsFromEvents(events, publicClient);
      return sessions;
    },
    enabled: !isNullish(chainId) && !isNullish(address) && !isNullish(publicClient),
  });

  useLayoutEffect(() => {
    if (data) {
      setSessions(data);
    }
  }, [data]);

  const onSessionRevoke = (session: Session) => {
    setSessions((previousSessions) => {
      const newSessions = previousSessions!.filter(
        (other) => other.payload.sessionHash !== session.payload.sessionHash,
      );
      return newSessions;
    });
  };

  return { sessions, isLoading, error, onSessionRevoke };
};
