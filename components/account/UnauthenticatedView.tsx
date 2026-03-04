import Button from 'components/common/Button';
import ConnectButton from 'components/header/ConnectButton';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';

interface Props {
  account: Address | undefined;
  signIn: () => void;
  isAuthenticating: boolean;
}

const UnauthenticatedView = ({ account, signIn, isAuthenticating }: Props) => {
  const t = useTranslations();

  return (
    <div className="max-w-3xl mx-auto py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-semibold leading-tight">{t('common.buttons.my_account')}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Please authenticate this wallet to access your account page.
        </p>
      </div>

      <section className="rounded-lg border border-black dark:border-white p-5 md:p-6 flex flex-col gap-4">
        {account ? (
          <Button style="primary" size="md" onClick={() => signIn()} loading={isAuthenticating} className="w-fit">
            Sign In With Ethereum
          </Button>
        ) : (
          <ConnectButton style="primary" size="md" className="w-fit" redirect />
        )}
      </section>
    </div>
  );
};

export default UnauthenticatedView;
