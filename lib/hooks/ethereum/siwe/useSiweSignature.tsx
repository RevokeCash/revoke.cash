import { useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';
import { createSiweMessage, generateSiweNonce } from 'viem/siwe';
import { useSignMessage } from 'wagmi';

export const useSiweSignature = (address: Address) => {
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

      const siweNonce = generateSiweNonce();

      const message = createSiweMessage({
        address,
        chainId: 1,
        domain: window.location.host,
        nonce: siweNonce,
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
