import { user } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';
import { siweCreateMessage, siweVerifyMessage } from 'lib/utils/siwe';
import { toast } from 'react-toastify';
import { useSignMessage } from 'wagmi';

const handleWagmiError = (error: Error) => {
  switch (error.name) {
    case 'UserRejectedRequestError':
      console.error('User rejected request', error);
      break;

    default:
      console.error('Error signing message', error);
      toast.error(`Error signing message: ${error.message}`);
      break;
  }
};

export const useSiwe = () => {
  const wagmi = useSignMessage();

  const meQuery = useQuery<user | undefined>({
    queryKey: ['account'],
    queryFn: async () => {
      const res = await fetch('/api/profile');
      if (res.status !== 200) return undefined;

      return res.json();
    },
    enabled: true,
  });

  const signIn = async (address: string) => {
    //  Create the SIWE message
    const message = await siweCreateMessage(address);

    return wagmi
      .signMessageAsync({ message })
      .then((signature) => siweVerifyMessage(message, signature))
      .then(() => meQuery.refetch())
      .then(() => toast.success('Signed in with SIWE'))
      .catch(handleWagmiError);
  };

  const signOut = async () => {
    const res = await fetch('/api/profile/logout');
    if (!res.ok) throw new Error('Error signing out');

    await meQuery.refetch();
  };

  return { signIn, signOut, session: meQuery.data, refetch: meQuery.refetch };
};
