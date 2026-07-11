import { useQuery } from '@tanstack/react-query';
import ky from 'lib/ky';
import type { Address } from 'viem';
import { createSiweMessage } from 'viem/siwe';
import { useSignMessage } from 'wagmi';

export const useSiweSignature = (address?: Address) => {
  const { mutateAsync: signMessageAsync } = useSignMessage();

  const {
    data: siwe,
    isLoading,
    error,
    refetch: signIn,
  } = useQuery({
    queryKey: ['siwe', 'signature', address, { persist: true }],
    queryFn: async () => {
      if (!address) return;

      // The nonce is issued by the server and doubles as a session-bound replay guard
      const { nonce } = await ky.get('/api/auth/siwe/nonce').json<{ nonce: string }>();

      const message = createSiweMessage({
        address,
        chainId: 1,
        domain: window.location.host,
        nonce,
        uri: window.location.origin,
        version: '1',
        statement: 'Sign in with Ethereum to Revoke.cash',
      });

      const signature = await signMessageAsync({ account: address, message });
      return { address, message, signature };
    },
    enabled: false, // Signing in is done manually
    staleTime: Infinity,
  });

  return { siwe, error, isLoading, signIn };
};
