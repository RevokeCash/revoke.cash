import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AUTH_SESSION_QUERY_KEY } from 'lib/auth/session';
import ky from 'lib/ky';
import { useConnection } from 'wagmi';
import { useSiweSignature } from './useSiweSignature';

export const useSiweSignIn = () => {
  const queryClient = useQueryClient();
  const { address } = useConnection();
  const { error: signatureError, isLoading: isSigning, signIn: signSiweMessage } = useSiweSignature(address);

  const {
    mutateAsync: verifySiweMessage,
    error: verifyError,
    isPending: isVerifying,
  } = useMutation({
    mutationFn: async () => {
      const signatureResult = await signSiweMessage();
      if (signatureResult.error) {
        throw signatureResult.error;
      }

      const siwe = signatureResult.data;
      if (!siwe?.address || !siwe?.message || !siwe?.signature) return null;

      const verifyRes = await ky
        .post('/api/auth/siwe/verify', {
          method: 'POST',
          json: siwe,
        })
        .json<{ ok: boolean }>();

      if (!verifyRes.ok) throw new Error('Error verifying SIWE message');

      await queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY });
      return siwe.address;
    },
  });

  const signIn = async () => {
    return verifySiweMessage();
  };

  return {
    signIn,
    error: signatureError || verifyError,
    isLoading: isSigning || isVerifying,
  };
};
