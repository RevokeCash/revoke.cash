import { useQuery } from '@tanstack/react-query';
import ky from 'lib/ky';
import { DAY, WEEK } from 'lib/utils/time';
import { useConnection } from 'wagmi';
import { useSiweSignature } from './useSiweSignature';

export const useSiwe = () => {
  const { address } = useConnection();
  const { siwe, error: signError, isLoading: signIsLoading, signIn } = useSiweSignature(address!);

  const {
    data: siweAddress,
    isLoading: addressIsLoading,
    error: addressError,
  } = useQuery({
    queryKey: ['siwe', 'address', siwe?.address, { persist: true }],
    queryFn: async () => {
      if (!siwe?.address || !siwe?.message || !siwe?.signature) return null;

      // Verify signature
      const verifyRes = await ky
        .post('/api/siwe/verify', {
          method: 'POST',
          json: siwe,
        })
        .json<{ ok: boolean }>();

      if (!verifyRes.ok) throw new Error('Error verifying SIWE message');

      return address;
    },
    enabled: !!siwe?.address && !!siwe?.message && !!siwe?.signature,
    staleTime: 2 * WEEK - 1 * DAY,
    gcTime: 2 * WEEK,
  });

  const error = signError || addressError;
  const isLoading = signIsLoading || addressIsLoading;

  return { siweAddress, error, isLoading, signIn };
};
