import { UserCircleIcon } from '@heroicons/react/24/outline';
import { AddAlertRuleForm } from 'components/account/AddAlertRuleForm';
import { UpdateUserForm } from 'components/account/UpdateUserForm';
import Button from 'components/common/Button';
import { SiweButton } from 'components/siwe/SiweButton';
import PublicLayout from 'layouts/PublicLayout';
import { useSiwe } from 'lib/hooks/ethereum/useSiwe';
import { useMounted } from 'lib/hooks/useMounted';
import { useProfile } from 'lib/hooks/useProfile';

const ProfilePage = () => {
  const siwe = useSiwe();
  const profile = useProfile();

  // Enforce client side rendering
  const isMounted = useMounted();
  if (!isMounted) {
    return null;
  }
  return (
    <PublicLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-2 border-b-2">
          <div className="flex gap-2 items-center">
            <UserCircleIcon className="h-12 w-12" />
            <h1 className="text-5xl">Profile</h1>
          </div>
          <div>
            {siwe.session ? (
              <Button
                size="md"
                onClick={() => {
                  siwe.signOut();
                }}
              >
                Sign out
              </Button>
            ) : (
              <SiweButton />
            )}
          </div>
        </div>

        <UpdateUserForm />
        <AddAlertRuleForm />

        <div className="my-8 border">{profile && <pre>{JSON.stringify(profile, null, 2)}</pre>}</div>
      </div>
    </PublicLayout>
  );
};

export default ProfilePage;
