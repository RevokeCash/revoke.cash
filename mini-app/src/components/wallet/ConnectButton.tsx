import { useState } from "react";
import { useConnect, useAccount } from "wagmi";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import Button from "../common/MobileButton";
import WalletModal from "./WalletModal";

const ConnectButton = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { connect, connectors, error, isError } = useConnect();
  const { isConnected, isConnecting: wagmiConnecting } = useAccount();

  const farcasterConnector = connectors.find(c => c.id === 'farcaster');
  const injectedConnector = connectors.find(c => c.id === 'injected');
  const walletConnectConnector = connectors.find(c => c.id === 'walletConnect');
  const loading = isConnecting || wagmiConnecting;

  const handleFarcasterConnect = async () => {
    if (!farcasterConnector) {
      console.error('Farcaster connector not found');
      setShowFallback(true);
      return;
    }

    setIsConnecting(true);
    try {
      await connect({ connector: farcasterConnector });
    } catch (err) {
      console.error('Farcaster connection failed:', err);
      // Show fallback options if Farcaster connection fails
      setShowFallback(true);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleBrowserWalletConnect = () => {
    setShowWalletModal(true);
  };

  const handleWalletConnectConnect = async () => {
    if (!walletConnectConnector) {
      console.error('WalletConnect connector not found');
      return;
    }

    setIsConnecting(true);
    try {
      await connect({ connector: walletConnectConnector });
    } catch (err) {
      console.error('WalletConnect connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Don't show button if already connected
  if (isConnected) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {!showFallback ? (
        <>
          <Button
            style="primary"
            size="lg"
            onClick={handleFarcasterConnect}
            disabled={loading}
            className="min-w-48 justify-center"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>🔗</span>
                <span>Connect via Farcaster</span>
              </div>
            )}
          </Button>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center max-w-xs">
            Connect your Farcaster wallet to scan and manage your token approvals
          </p>

          {/* Development helper */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => setShowFallback(true)}
              className="text-xs text-zinc-500 dark:text-zinc-400 underline"
            >
              Development: Use WalletConnect instead
            </button>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {/* Browser Extension Wallets */}
            <Button
              style="secondary"
              size="lg"
              onClick={handleBrowserWalletConnect}
              disabled={loading}
              className="w-full justify-center"
            >
              <div className="flex items-center gap-2">
                <span>🦊</span>
                <span>Browser Wallet</span>
              </div>
            </Button>

            {/* WalletConnect for Mobile */}
            {walletConnectConnector && (
              <Button
                style="tertiary"
                size="lg"
                onClick={handleWalletConnectConnect}
                disabled={loading}
                className="w-full justify-center"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>📱</span>
                    <span>Mobile Wallet</span>
                  </div>
                )}
              </Button>
            )}
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center max-w-xs">
            Development mode - Choose your wallet type
          </p>

          <button
            onClick={() => setShowFallback(false)}
            className="text-xs text-zinc-500 dark:text-zinc-400 underline"
          >
            ← Back to Farcaster
          </button>
        </>
      )}

      {isError && error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          Connection failed. Please try again.
        </div>
      )}

      {/* Wallet Selection Modal */}
      <WalletModal 
        open={showWalletModal} 
        setOpen={setShowWalletModal} 
        connectors={connectors}
      />
    </div>
  );
};

export default ConnectButton;