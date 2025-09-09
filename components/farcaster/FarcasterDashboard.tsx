'use client';

import AllowanceDashboard from 'components/allowances/dashboard/AllowanceDashboard';
import WalletHealthSection from 'components/allowances/dashboard/wallet-health/WalletHealthSection';
import ConnectButton from 'components/header/ConnectButton';
import { useAddressAllowances, useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useAccount } from 'wagmi';
import { useFarcaster } from './FarcasterProvider';

// Component that uses the allowances context (only rendered when context is available)
const ConnectedDashboard = () => {
  const { sdk } = useFarcaster();
  const { allowances, isLoading } = useAddressAllowances();
  const { address } = useAccount();
  const { selectedChainId } = useAddressPageContext();

  const handleShare = async () => {
    if (!sdk) {
      // Fallback to web share
      const text = 'Just checked my wallet security with @revoke! Check yours at https://revoke.cash';
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`, '_blank');
      }
      return;
    }

    try {
      const riskCount =
        allowances?.filter((a) => a.payload?.spenderData?.riskFactors && a.payload.spenderData.riskFactors.length > 0)
          .length || 0;
      const text =
        riskCount > 0
          ? `⚠️ Found ${riskCount} risky token approvals in my wallet! Checking wallet security with @revoke 🔐\n\nCheck yours: https://revoke.cash`
          : '✅ My wallet is secure! No risky token approvals found. Checked with @revoke 🔐\n\nCheck yours: https://revoke.cash';

      await sdk.actions.composeCast({
        text,
        embeds: ['https://revoke.cash'],
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-8">
      {/* Wallet Health Summary */}
      {address && (
        <div className="mb-8">
          <WalletHealthSection address={address} chainId={selectedChainId} />
        </div>
      )}

      {/* Share Button */}
      {!isLoading && allowances && allowances.length > 0 && (
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={handleShare}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <title>X (Twitter) icon</title>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on Farcaster
          </button>
        </div>
      )}

      {/* Allowances Table */}
      <AllowanceDashboard />
    </div>
  );
};

// Main component that handles the connected/disconnected state
const FarcasterDashboard = ({ hasContext = false }: { hasContext?: boolean }) => {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">Connect Your Wallet</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            Connect your wallet to view and manage token approvals
          </p>
          <ConnectButton size="lg" />
        </div>
      </div>
    );
  }

  // If connected but no context, we shouldn't render the dashboard
  // This shouldn't happen with our current setup, but adding for safety
  if (!hasContext) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="text-center max-w-md">
          <p className="text-zinc-600 dark:text-zinc-400">Loading wallet data...</p>
        </div>
      </div>
    );
  }

  return <ConnectedDashboard />;
};

export default FarcasterDashboard;
