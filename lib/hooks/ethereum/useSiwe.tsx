import { useAccount } from 'wagmi';
import { useSiweSignature } from './useSiweSignature';

export const useSiwe = () => {
  const { address } = useAccount();

  const { siwe, error: signError, isLoading: signIsLoading, signIn } = useSiweSignature(address);

  // const {
  //   data: siweAddress,
  //   isLoading: addressIsLoading,
  //   error: addressError,
  // } = useQuery({
  //   queryKey: ['siwe', 'address', siwe?.address],
  //   queryFn: async () => {
  //     if (!siwe?.address || !siwe?.message || !siwe?.signature) throw new Error('Invalid SIWE message');
  //     console.log('siwe', siwe);

  //     // Verify signature
  //     const verifyRes = await fetch('/api/siwe/verify', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(siwe),
  //     });
  //     if (!verifyRes.ok) throw new Error('Error verifying SIWE message');

  //     return address;
  //   },
  //   staleTime: 2 * WEEK - 1 * DAY,
  // });

  // const error = signError || addressError;
  // const isLoading = signIsLoading || addressIsLoading;

  return { signIn };
};
