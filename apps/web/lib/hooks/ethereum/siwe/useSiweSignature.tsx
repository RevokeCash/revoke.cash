import { useQuery } from '@tanstack/react-query';
import ky from 'lib/ky';
import type { Address } from 'viem';
import { createSiweMessage } from 'viem/siwe';
import { useConfig, useSignMessage } from 'wagmi';
import { getConnection } from 'wagmi/actions';

export const useSiweSignature = (address?: Address) => {
  const { mutateAsync: signMessageAsync } = useSignMessage();
  const config = useConfig();

  const {
    data: siwe,
    isLoading,
    error,
    refetch: signIn,
  } = useQuery({
    queryKey: ['siwe', 'signature', address, { persist: true }],
    queryFn: async () => {
      // A sign-in triggered right after connecting can run before the connection hook state has
      // propagated, so fall back to the imperative connection state for the just-connected address.
      const signingAddress = address ?? getConnection(config).address;
      if (!signingAddress) return;

      // The nonce is issued by the server and doubles as a session-bound replay guard
      const { nonce } = await ky.get('/api/auth/siwe/nonce').json<{ nonce: string }>();

      const message = createSiweMessage({
        address: signingAddress,
        chainId: 1,
        domain: window.location.host,
        nonce,
        uri: window.location.origin,
        version: '1',
        statement: 'Sign in with Ethereum to Revoke.cash',
      });

      const signature = await signMessageAsync({ account: signingAddress, message });
      return { address: signingAddress, message, signature };
    },
    enabled: false, // Signing in is done manually
    staleTime: Infinity,
  });

  return { siwe, error, isLoading, signIn };
};
