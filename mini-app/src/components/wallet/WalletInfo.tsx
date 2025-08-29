import { useEffect, useState } from "react";
import { useBalance, useChainId } from "wagmi";
import { Address } from "viem";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { ShareButton } from "../farcaster/ShareButton";

interface WalletInfoProps {
  address: Address;
}

export const WalletInfo = ({ address }: WalletInfoProps) => {
  const chainId = useChainId();
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
  });
  
  const [walletAge, setWalletAge] = useState<number | null>(null);
  const [transactionCount, setTransactionCount] = useState<number | null>(null);

  // Get real wallet analytics
  useEffect(() => {
    const fetchWalletStats = async () => {
      try {
        // For now, these are placeholders since getting wallet age and transaction count
        // requires additional blockchain queries that the main app doesn't currently expose
        // In a full implementation, you would:
        // 1. Query the blockchain for the first transaction from this address
        // 2. Calculate age from that timestamp
        // 3. Count total transactions from block explorers or indexers
        
        setWalletAge(null); // Will show loading spinner
        setTransactionCount(null); // Will show loading spinner
      } catch (error) {
        console.error('Failed to fetch wallet stats:', error);
      }
    };

    fetchWalletStats();
  }, [address]);

  const getChainName = (chainId: number) => {
    const chains: Record<number, string> = {
      1: 'Ethereum',
      8453: 'Base',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
    };
    return chains[chainId] || `Chain ${chainId}`;
  };

  const formatBalance = (balance: bigint, decimals: number, symbol: string) => {
    const value = Number(balance) / Math.pow(10, decimals);
    return `${value.toFixed(4)} ${symbol}`;
  };

  const formatAddress = (addr: Address) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="bg-white dark:bg-black rounded-lg p-4 border border-black dark:border-white">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Wallet Overview
        </h2>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-zinc-600 dark:text-zinc-400">Address:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                {formatAddress(address)}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(address)}
                className="text-revoke-orange hover:text-orange-600 text-sm"
                title="Copy address"
              >
                📋
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-zinc-600 dark:text-zinc-400">Network:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {getChainName(chainId)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-zinc-600 dark:text-zinc-400">Balance:</span>
            {balanceLoading ? (
              <LoadingSpinner size="sm" />
            ) : balance ? (
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {formatBalance(balance.value, balance.decimals, balance.symbol)}
              </span>
            ) : (
              <span className="text-zinc-500">--</span>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Stats */}
      <div className="bg-white dark:bg-black rounded-lg p-4 border border-black dark:border-white">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Wallet Statistics
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {walletAge === null ? (
                <LoadingSpinner size="sm" />
              ) : (
                `${walletAge}d`
              )}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Wallet Age
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {transactionCount === null ? (
                <LoadingSpinner size="sm" />
              ) : (
                transactionCount.toLocaleString()
              )}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Transactions
            </div>
          </div>
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          💡 Security Tips
        </h3>
        
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>• Regularly review and revoke unused token approvals</li>
          <li>• Never share your private keys or seed phrase</li>
          <li>• Use hardware wallets for large amounts</li>
          <li>• Be cautious of phishing websites and emails</li>
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`https://revoke.cash/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-center"
          >
            Full Analysis
          </a>
          
          <ShareButton
            text={`Just checked my wallet security with @revoke! 🔍\n\nWallet age: ${walletAge} days\nTransactions: ${transactionCount?.toLocaleString()}\n\nCheck yours: https://revoke.cash`}
            className="btn-primary text-center"
          >
            Share Results
          </ShareButton>
        </div>
      </div>
    </div>
  );
};