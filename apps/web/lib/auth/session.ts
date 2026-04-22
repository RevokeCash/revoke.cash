import type { Address } from 'viem';

export interface AuthSession {
  hasApiSession: boolean;
  siweAddress: Address | null;
}

export const AUTH_SESSION_QUERY_KEY = ['auth', 'session'] as const;

export const UNAUTHENTICATED_AUTH_SESSION: AuthSession = {
  hasApiSession: false,
  siweAddress: null,
};
