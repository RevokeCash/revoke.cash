import { useQuery } from '@tanstack/react-query';
import { getSessionEvents } from 'lib/chains/events';
import { isNullish } from 'lib/utils';
import { getSessionsFromEvents, type Session } from 'lib/utils/sessions';
import { useLayoutEffect, useState } from 'react';
import type { Address } from 'viem';
import { usePublicClient } from 'wagmi';

export const useSessions = (address: Address, chainId: number) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const publicClient = usePublicClient({ chainId })!;

  const { data, isLoading, error } = useQuery({
    queryKey: ['sessions', chainId, address],
    queryFn: async () => {
      const events = await getSessionEvents(chainId, address);
      const sessions = await getSessionsFromEvents(events, publicClient);
      return sessions;
    },
    enabled: !isNullish(chainId) && !isNullish(address),
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
