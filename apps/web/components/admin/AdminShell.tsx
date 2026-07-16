'use client';

import { useQueryClient } from '@tanstack/react-query';
import Button from 'components/common/Button';
import ContentPageHero from 'components/common/ContentPageHero';
import Loader from 'components/common/Loader';
import ColorThemeSelect from 'components/footer/ColorThemeSelect';
import ConnectButton from 'components/header/ConnectButton';
import { ADMIN_SESSION_QUERY_KEY, useAdminSession } from 'lib/hooks/admin/useAdminSession';
import { useAuthSession } from 'lib/hooks/auth/useAuthSession';
import { useSiweSignIn } from 'lib/hooks/ethereum/siwe/useSiweSignIn';
import { useConnection } from 'wagmi';
import AdminNavigation from './AdminNavigation';

interface Props {
  children: React.ReactNode;
}

const AdminShell = ({ children }: Props) => {
  const { isAdmin, isLoading } = useAdminSession();

  if (isLoading) {
    return (
      <div className="py-8 flex flex-col gap-6">
        <AdminHeader />
        <Loader isLoading className="h-96" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminSignInView />;
  }

  return (
    <div className="py-8 flex flex-col gap-6">
      <AdminHeader />
      <AdminNavigation />

      {children}
    </div>
  );
};

const AdminHeader = () => (
  <div className="w-full flex flex-wrap items-center justify-between gap-4">
    <h1 className="text-4xl font-semibold leading-tight">Admin</h1>
    <ColorThemeSelect menuPlacement="bottom" />
  </div>
);

// Admin access requires a recent SIWE signature, so even an existing session may need to sign in again
const AdminSignInView = () => {
  const queryClient = useQueryClient();
  const { address: account } = useConnection();
  const { siweAddress } = useAuthSession();
  const { signIn, isLoading: isAuthenticating } = useSiweSignIn();

  // Re-signing with the same address leaves the session query key unchanged, so the admin
  // session must be invalidated explicitly for the gate to re-evaluate
  const handleSignIn = async () => {
    try {
      await signIn();
      await queryClient.invalidateQueries({ queryKey: ADMIN_SESSION_QUERY_KEY });
    } catch {
      // Sign-in errors are surfaced through the useSiweSignIn error state
    }
  };

  return (
    <div className="flex flex-col items-center">
      <ContentPageHero
        title="Admin"
        subtitle={
          siweAddress
            ? 'This dashboard requires a fresh sign-in with the admin wallet.'
            : 'Sign in with the admin wallet to continue.'
        }
      />

      <div className="w-full max-w-md flex flex-col gap-6">
        {account ? (
          <Button
            style="primary"
            size="md"
            onClick={() => handleSignIn()}
            loading={isAuthenticating}
            className="w-full justify-center"
          >
            {isAuthenticating ? 'Authenticating...' : 'Sign in with Ethereum'}
          </Button>
        ) : (
          <ConnectButton style="primary" size="md" className="w-full justify-center" onConnect={handleSignIn} />
        )}
      </div>
    </div>
  );
};

export default AdminShell;
