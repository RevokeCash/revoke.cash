import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { type Connector, useConnect } from 'wagmi';
import { filterAndSortConnectors, getConnectorName, getWalletIcon } from '@revoke-lib/utils/wallet';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import Button from '../common/MobileButton';

interface WalletModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  connectors: Connector[];
}

const WalletModal = ({ open, setOpen, connectors }: WalletModalProps) => {
  const [connecting, setConnecting] = useState<string | null>(null);
  const { connect } = useConnect();

  const sortedConnectors = filterAndSortConnectors(connectors as any);

  const handleConnect = async (connector: Connector) => {
    setConnecting(connector.id);
    try {
      await connect({ connector });
      setOpen(false);
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setConnecting(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50" onClick={() => setOpen(false)} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-black border border-black dark:border-white rounded-lg p-6 w-full max-w-md">
          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 p-1 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Header */}
          <h2 className="text-2xl font-bold text-center mb-6 text-zinc-900 dark:text-zinc-100">
            Connect Wallet
          </h2>

          {/* Wallet list */}
          <div className="flex flex-col gap-3">
            {sortedConnectors.map((connector) => (
              <Button
                key={`${connector.id}-${connector.name}`}
                style="secondary"
                size="lg"
                onClick={() => handleConnect(connector)}
                disabled={connecting !== null}
                className="flex justify-start items-center gap-3 p-4 w-full text-left"
              >
                {connecting === connector.id ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <img
                    src={getWalletIcon(connector)}
                    alt={getConnectorName(connector)}
                    width={32}
                    height={32}
                    className="rounded-md border border-zinc-200 dark:border-zinc-700"
                  />
                )}
                <span className="flex-1">{getConnectorName(connector)}</span>
              </Button>
            ))}
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center mt-4">
            Choose your preferred wallet to connect
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;