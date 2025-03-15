import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import Card from 'components/common/Card';
import CopyButton from 'components/common/CopyButton';
import ConnectButton from 'components/header/ConnectButton';
import {
  FAIRSIDE_APP_URL,
  FAIRSIDE_REFERRAL_CODE,
  getAuthenticationMessage,
  getCoveredWallets,
  loginUser,
} from 'lib/coverage/fairside';
import { isNullish } from 'lib/utils';
import { isUserRejectionError, parseErrorMessage } from 'lib/utils/errors';
import { shortenAddress } from 'lib/utils/formatting';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { toast } from 'react-toastify';
import type { Address } from 'viem';
import { useWalletClient } from 'wagmi';

interface WalletDetailsProps {
  walletAddress: Address;
}

interface WalletEntry {
  walletAddress: string;
}

const WalletDetailsCard = ({ walletAddress }: WalletDetailsProps) => {
  const t = useTranslations();
  const [token, setToken] = useState<string | null>(null);
  const [wallets, setWallets] = useState<WalletEntry[] | null>(null);
  const { data: walletClient } = useWalletClient();

  const isAuthenticated = !isNullish(token);

  const { execute: handleAuthentication, loading: isAuthenticating } = useAsyncCallback(async () => {
    if (!walletClient) {
      toast.error('Please connect your wallet to authenticate');
      return;
    }

    try {
      // Step 1: Generate message to sign
      const messageData = await getAuthenticationMessage({ walletAddress });
      if (!messageData) {
        toast.error('Could not generate authentication message');
        return;
      }

      // Step 2: Request signature from user
      const signature = await walletClient.signMessage({
        message: messageData.message,
      });

      // Step 3: Verify signature with Fairside
      const accessToken = await loginUser({
        walletAddress,
        signature,
        nonce: messageData.nonce,
        referralCode: FAIRSIDE_REFERRAL_CODE,
      });

      if (!accessToken) {
        toast.error('Failed to authenticate');
        return;
      }

      setToken(accessToken);

      // Step 4: Fetch wallets after successful authentication
      const coveredWallets = await getCoveredWallets({ accessToken });
      setWallets([{ walletAddress }, ...(coveredWallets ?? [])]);
    } catch (error) {
      console.error('Authentication error:', error);
      if (isUserRejectionError(parseErrorMessage(error))) return;

      toast.error('Failed to authenticate with Fairside');
      setWallets([{ walletAddress }]);
    }
  });

  if (!isAuthenticated) {
    return (
      <Card title={t('address.coverage.wallets.title')} className="py-0">
        <div className="p-7.25 flex flex-col gap-4 items-center justify-center text-center">
          <p className="text-zinc-600 dark:text-zinc-400">{t('address.coverage.wallets.description')}</p>
          {walletClient ? (
            <Button style="secondary" size="md" onClick={handleAuthentication} loading={isAuthenticating}>
              {isAuthenticating ? t('common.buttons.authenticating') : t('common.buttons.authenticate')}
            </Button>
          ) : (
            <ConnectButton style="secondary" size="md" />
          )}
        </div>
      </Card>
    );
  }

  const title = (
    <span className="flex items-center w-full justify-between">
      <span>{t('address.coverage.wallets.title')}</span>
      <span className="text-xs italic font-normal">
        {wallets && wallets.length > 0 ? wallets.length : 0} / 10 {t('address.coverage.wallets.wallets')}
      </span>
    </span>
  );

  return (
    <Card title={title} className="py-0">
      <div className="divide-y divide-zinc-200 dark:divide-zinc-700 min-h-[90px] max-h-[180px] overflow-y-auto">
        {wallets && Array.isArray(wallets)
          ? wallets.map((wallet, index) => (
              <div key={wallet.walletAddress} className="py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="rounded-full flex items-center justify-center text-sm font-medium">{index + 1}.</div>
                  <span className="flex items-center gap-1 font-mono text-sm text-zinc-600 dark:text-zinc-300">
                    {shortenAddress(wallet.walletAddress, 8)}
                    <CopyButton content={wallet.walletAddress} />
                  </span>
                </div>
              </div>
            ))
          : null}
        <div />
      </div>
      {wallets && wallets.length < 10 && (
        <div className="p-4 flex justify-center">
          <Button style="secondary" size="md" href={FAIRSIDE_APP_URL} external className="flex items-center gap-2">
            {t('address.coverage.wallets.add')}
            <ArrowTopRightOnSquareIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
          </Button>
        </div>
      )}
    </Card>
  );
};

export default WalletDetailsCard;
