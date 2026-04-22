import ContentPageLayout from 'app/layouts/ContentPageLayout';
import { getServerAuthSession } from 'lib/api/auth';
import { AuthSessionProvider } from 'lib/hooks/auth/AuthSessionProvider';

interface Props {
  children: React.ReactNode;
}

const AccountLayout = async ({ children }: Props) => {
  const session = await getServerAuthSession();

  return (
    <ContentPageLayout searchBar>
      <AuthSessionProvider initialSession={session}>{children}</AuthSessionProvider>
    </ContentPageLayout>
  );
};

export default AccountLayout;
