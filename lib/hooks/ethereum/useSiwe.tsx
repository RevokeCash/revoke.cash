import { useQuery } from '@tanstack/react-query';
import { siweCreateMessage, siweVerifyMessage } from 'lib/utils/siwe';
import { useSignMessage } from 'wagmi';

export const useSiwe = (address: string) => {
  const wagmi = useSignMessage();

  const signIn = async () => {
    //  Create the SIWE message
    const message = await siweCreateMessage(address);

    // Sign the SIWE message using the wallet
    const signature = await wagmi.signMessageAsync({ message });

    // Verify the SIWE message using our backend
    await siweVerifyMessage(message, signature);
  };

  const signOut = async () => {
    const res = await fetch('/api/siwe/logout');
    if (!res.ok) throw new Error('Error signing out');
  };

  const meQuery = useQuery({
    queryKey: ['siwe', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/siwe/me');
      if (!res.ok) throw new Error('Error fetching SIWE session');
      return res.json();
    },
  });

  return { signIn, signOut, siwe: meQuery.data };
};
