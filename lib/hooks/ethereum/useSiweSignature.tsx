import { useQuery } from '@tanstack/react-query';
import { SiweMessage } from 'siwe';
import { useSignMessage } from 'wagmi';

export const useSiweSignature = (address: string) => {
  const { signMessageAsync } = useSignMessage();

  const {
    data: siwe,
    isLoading,
    error,
    refetch: signIn,
  } = useQuery({
    queryKey: ['siwe', 'signature', address, { persist: true }],
    queryFn: async () => {
      if (!address) return;

      // Fetch random nonce, create SIWE message, and sign with wallet
      const nonceRes = await fetch('/api/siwe/nonce');
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to Revoke.cash.',
        uri: window.location.origin,
        version: '1',
        chainId: 1,
        nonce: await nonceRes.text(),
      }).prepareMessage();

      const signature = await signMessageAsync({ message });

      const verifyRes = await fetch('/api/siwe/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, signature }),
      });

      if (!verifyRes.ok) throw new Error('Error verifying SIWE message');

      return {
        address,
        message,
        signature,
      };
    },
    enabled: false, // Signing in is done manually
    staleTime: Infinity,
  });

  return { siwe, error, isLoading, signIn };
};
