import CopyButton from 'components/common/CopyButton';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { twMerge } from 'tailwind-merge';
import { useWalletClient } from 'wagmi';

interface WalletDetailsProps {
  isAuthenticated: boolean;
  className?: string;
  fsdAPI?: any;
  walletAddress?: string;
  token?: string | null;
  setToken: (token: string) => void;
}

interface WalletEntry {
  walletAddress: string;
}

interface SignatureResponse {
  message: string;
  walletAddress: string;
  nonce: string;
}

const WalletDetails = ({ isAuthenticated, className, fsdAPI, walletAddress, token, setToken }: WalletDetailsProps) => {
  const t = useTranslations('address.coverage');
  const [wallets, setWallets] = useState<WalletEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data: walletClient } = useWalletClient();

  const handleAuthentication = async () => {
    if (!fsdAPI || !walletAddress || !walletClient) {
      console.log('fsdAPI', fsdAPI);
      console.log('walletAddress', walletAddress);
      console.log('walletClient', walletClient);
      toast.error('Missing required data for authentication');
      return;
    }

    try {
      setIsLoading(true);

      // Step 1: Generate message to sign
      const messageData = await fsdAPI.generateMessageToSign(walletAddress);
      if (!messageData) {
        toast.error('Failed to generate message to sign');
        return;
      }

      // Step 2: Request signature from user
      const signature = await walletClient.signMessage({
        message: messageData.message as `0x${string}`,
      });

      // Step 3: Verify signature with Fairside
      const response = await fsdAPI.createOrLoginUser({
        walletAddress,
        signature,
        nonce: messageData.nonce,
        referralCode: 'revoke.cash',
      });
      if (!response?.token) {
        toast.error('Failed to authenticate');
        return;
      }

      setToken(response.token);

      // Step 4: Fetch wallets after successful authentication
      const walletDataResponse = await fsdAPI.getCoveredWallets({ accessToken: response.token });
      setWallets([{ walletAddress: walletAddress ?? '' }, ...walletDataResponse.wallets]);
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error('Failed to authenticate with Fairside');
      setWallets([{ walletAddress: walletAddress ?? '' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWallet = async () => {
    try {
      // This would need to be implemented based on Fairside's SDK
      // Typically would open a modal or redirect to add wallet flow
      window.open('https://test.fairside.dev/add-wallet', '_blank');
    } catch (error) {
      console.error('Error adding wallet:', error);
      toast.error('Failed to add wallet');
    }
  };
  if (!isAuthenticated) {
    return (
      <div className={twMerge('border border-gray-400 dark:border-gray-700 rounded-lg overflow-hidden', className)}>
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-medium">
          Covered Wallets
        </div>
        <div className="p-6 flex flex-col items-center justify-center text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Connect your wallet to view and manage your covered wallets
          </p>
          <button
            type="button"
            onClick={handleAuthentication}
            className="px-4 py-2 bg-white hover:bg-white/80 text-black rounded-full transition-colors border border-gray-800 hover:shadow-[0_8px_8px_rgba(0,0,0,0.25)] duration-300ms ease-in-out"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={twMerge('border border-gray-400 dark:border-gray-700 rounded-lg overflow-hidden', className)}>
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-medium">
        <div>Covered Wallets{isAuthenticated && ` - ${wallets && wallets.length > 0 ? wallets.length : ''}`}</div>
        <div className="text-xs italic">Max 10 wallets</div>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[180px] overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">Loading wallets...</div>
        ) : (
          wallets &&
          Array.isArray(wallets) &&
          wallets.map((wallet) => (
            <div key={wallet.walletAddress} className="px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-full flex items-center justify-center text-sm font-medium">
                  {wallets.indexOf(wallet) + 1}.
                </div>
                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                  {wallet.walletAddress.slice(0, 6)}...{wallet.walletAddress.slice(-4)}
                </span>
                <CopyButton content={wallet.walletAddress} />
              </div>
              {/* <span className="text-sm font-medium">
                {wallet.chain}
              </span> */}
            </div>
          ))
        )}
      </div>
      {wallets && wallets.length < 10 && (
        <div className="p-4 flex justify-center border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleAddWallet}
            className="px-4 py-2 bg-white hover:bg-white/80 text-black rounded-full transition-colors border border-gray-800 hover:shadow-[0_8px_8px_rgba(0,0,0,0.25)] duration-300ms ease-in-out"
          >
            Add Wallet
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletDetails;
