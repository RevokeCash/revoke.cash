import Button from 'components/common/Button';
import PublicLayout from 'layouts/PublicLayout';
import { useSiweSignature } from 'lib/hooks/ethereum/useSiweSignature';
import { useApiSession } from 'lib/hooks/useApiSession';
import { useMounted } from 'lib/hooks/useMounted';

const ProfilePage = () => {
  const isMounted = useMounted();

  const session = useApiSession();
  // const account = useAccount();

  const siwe = useSiweSignature('0x4AFB3a7246B3F42D49FfE41eEC8c0688f206f7cb');
  if (!isMounted) {
    return null;
  }

  return (
    <PublicLayout>
      <div className="flex flex-col gap-2 py-8">
        <h1 className="text-6xl font-bold">Profile</h1>
        <pre>Step 1, Sign in with Ethereum.</pre>
        <pre>Step 2, Link a mail address to wallet address</pre>
        <pre>Step 3, Enable notifications</pre>
      </div>

      <div className="py-8">
        {/* <SiweButton text="Sign signature" /> */}

        <Button
          onClick={() => {
            siwe.signIn();
          }}
        >
          SIWE
        </Button>
      </div>

      <div className="py-8">
        <h2 className="text-4xl font-bold">Session</h2>
        <pre>{JSON.stringify(session, null, 2)}</pre>
      </div>

      <div className="py-8">
        <h2 className="text-4xl font-bold">Siwe</h2>
        <pre>{JSON.stringify(siwe, null, 2)}</pre>
      </div>
    </PublicLayout>
  );
};

export default ProfilePage;
