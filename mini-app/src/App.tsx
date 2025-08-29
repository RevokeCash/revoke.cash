import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useState } from "react";
import { useAccount, useChainId, useBalance } from "wagmi";
import { useEvents } from "@revoke-lib/hooks/ethereum/events/useEvents";
import { useAllowances } from "@revoke-lib/hooks/ethereum/useAllowances";
import Header from "./components/layout/Header";
import WalletIndicator from "./components/wallet/WalletIndicator";

function App() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [activeTab, setActiveTab] = useState<'scan' | 'share'>('scan');
  const [error, setError] = useState<string | null>(null);
  const [scanEnabled, setScanEnabled] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Get balance for connected wallet
  const { data: balanceData } = useBalance({
    address: address,
    chainId: chainId,
  });

  // Only fetch data when scan is enabled and wallet is connected
  const { events, isLoading: eventsLoading, error: eventsError } = useEvents(
    isConnected && scanEnabled ? address! : '0x0000000000000000000000000000000000000000' as const, 
    chainId
  );
  
  const { allowances, isLoading: allowancesLoading, error: allowancesError } = useAllowances(
    isConnected && scanEnabled ? address! : '0x0000000000000000000000000000000000000000' as const, 
    events, 
    chainId
  );

  const loading = scanEnabled && (eventsLoading || allowancesLoading);
  const scanError = eventsError || allowancesError;

  useEffect(() => {
    try {
      sdk.actions.ready();
      console.log("Farcaster SDK ready");
    } catch (error) {
      console.error("SDK error:", error);
      setError(`SDK Error: ${error}`);
    }
  }, []);

  console.log("App rendering", { isConnected, address, chainId, scanEnabled, loading });

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Process allowances safely
  const processedAllowances = scanEnabled && allowances ? 
    allowances
      .filter(allowance => allowance.payload)
      .map(allowance => {
        try {
          const payload = allowance.payload!;
          
          let riskLevel: 'high' | 'medium' | 'low' = 'low';
          let amount = 'unknown';
          
          // Risk assessment
          if (payload.type === 'ERC20' && payload.amount === 2n ** 256n - 1n) {
            riskLevel = 'high';
            amount = 'unlimited';
          } else if (payload.type === 'ERC721_ALL') {
            riskLevel = 'high';
            amount = 'all NFTs';
          } else if (payload.spenderData?.riskFactors && payload.spenderData.riskFactors.length > 0) {
            riskLevel = 'high';
          } else if (!payload.spenderData?.name) {
            riskLevel = 'medium';
          }

          if (payload.type === 'ERC20' && amount === 'unknown') {
            const decimals = allowance.metadata?.decimals || 18;
            const numericAmount = Number(payload.amount) / Math.pow(10, decimals);
            amount = numericAmount.toLocaleString(undefined, { maximumFractionDigits: 6 });
          }

          return {
            id: `${allowance.contract.address}-${payload.spender}`,
            tokenSymbol: allowance.metadata.symbol || 'UNKNOWN',
            spenderName: payload.spenderData?.name || `${payload.spender.slice(0, 6)}...${payload.spender.slice(-4)}`,
            amount,
            riskLevel,
            lastUpdated: new Date((payload.lastUpdated.timestamp || 0) * 1000).toLocaleDateString(),
          };
        } catch (error) {
          console.error('Error processing allowance:', error);
          return null;
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        const riskOrder = { high: 0, medium: 1, low: 2 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      }) : [];

  const highRiskCount = processedAllowances.filter((a: any) => a.riskLevel === 'high').length;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans transition-colors">
      <Header />

      <div className="p-4 max-w-6xl mx-auto">
      
      {error && (
        <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded mb-5 text-red-600 dark:text-red-400">
          Error: {error}
        </div>
      )}
      
      <div className="bg-white dark:bg-black border border-black dark:border-white rounded-lg mb-5 overflow-hidden">
        {!isConnected ? (
          <div className="py-15 px-10 text-center max-w-2xl mx-auto my-10">
            <div className="text-6xl mb-6">🔐</div>
            <h2 className="mb-4 text-zinc-900 dark:text-zinc-100 text-3xl font-bold tracking-tight">
              Secure Your Wallet
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed mb-8">
              Scan and manage your token approvals to protect your assets from potential risks
            </p>
            <div className="flex justify-center">
              <WalletIndicator />
            </div>
          </div>
        ) : (
          <div className="p-5">

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-5">
              <button
                onClick={() => setActiveTab('scan')}
                className={`flex-1 py-2.5 px-5 border-none rounded-md cursor-pointer font-medium transition-all duration-200 ${
                  activeTab === 'scan' 
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold' 
                    : 'bg-transparent text-zinc-500 dark:text-zinc-400 font-normal'
                }`}
              >
                🔍 {scanEnabled ? 'Allowances' : 'Scan Wallet'}
              </button>
              <button
                onClick={() => setActiveTab('share')}
                className={`flex-1 py-2.5 px-5 border-none rounded-md cursor-pointer font-medium transition-all duration-200 ${
                  activeTab === 'share' 
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold' 
                    : 'bg-transparent text-zinc-500 dark:text-zinc-400 font-normal'
                }`}
              >
                📢 Share
              </button>
            </div>

            {activeTab === 'scan' && (
              <div>
                {!scanEnabled ? (
                  <div className="text-center py-15 px-5 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                    <div className="text-6xl mb-5">🔍</div>
                    <h3 className="mb-3 text-zinc-900 dark:text-zinc-100 text-2xl font-bold">
                      Scan Your Wallet
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-base max-w-md mx-auto">
                      Analyze your token approvals and identify security risks
                    </p>
                    <button
                      onClick={() => setScanEnabled(true)}
                      className="py-3 px-8 bg-orange-400 text-black border-none rounded-lg text-base font-semibold cursor-pointer mb-4 inline-block hover:bg-orange-500 transition-colors"
                    >
                      Start Scan 🔍
                    </button>
                    <div>
                      <a
                        href={`https://revoke.cash/address/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 dark:text-zinc-400 underline text-sm hover:text-zinc-600 dark:hover:text-zinc-300"
                      >
                        View Full Analysis →
                      </a>
                    </div>
                  </div>
                ) : loading ? (
                  <div className="text-center py-10">
                    <div className="text-2xl mb-2.5">🔄</div>
                    <p className="text-zinc-600 dark:text-zinc-400">Scanning your wallet for token approvals...</p>
                  </div>
                ) : scanError ? (
                  <div className="text-center py-10">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h3 className="mb-4 text-red-600 dark:text-red-400 text-lg font-semibold">Scan Error</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-5">
                      Unable to scan wallet. Please try again or use the full analysis.
                    </p>
                    <button
                      onClick={() => setScanEnabled(false)}
                      className="py-2 px-4 bg-zinc-500 text-white border-none rounded text-sm cursor-pointer mr-2.5 hover:bg-zinc-600 transition-colors"
                    >
                      Try Again
                    </button>
                    <a
                      href={`https://revoke.cash/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-4 bg-orange-400 text-black no-underline rounded text-sm hover:bg-orange-500 transition-colors"
                    >
                      Full Analysis →
                    </a>
                  </div>
                ) : (
                  <div>
                    {/* Wallet Health Summary */}
                    <div className={`p-4 rounded-md mb-5 ${
                      highRiskCount > 0 
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                        : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    }`}>
                      <h3 className="m-0 mb-2.5 text-zinc-900 dark:text-zinc-100">
                        {highRiskCount > 0 ? '⚠️' : '✅'} Wallet Health
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                            {processedAllowances.length}
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-400">Total Allowances</div>
                        </div>
                        <div>
                          <div className={`text-2xl font-bold ${
                            highRiskCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                          }`}>
                            {highRiskCount}
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-400">High Risk</div>
                        </div>
                      </div>
                      {highRiskCount > 0 && (
                        <p className="text-red-600 dark:text-red-400 text-sm mt-2.5 mb-0">
                          You have {highRiskCount} high-risk allowance{highRiskCount > 1 ? 's' : ''} that should be revoked.
                        </p>
                      )}
                    </div>

                    {/* Allowances List */}
                    {processedAllowances.length > 0 ? (
                      <div>
                        <h3 className="mb-4 text-zinc-900 dark:text-zinc-100">Token Allowances</h3>
                        {processedAllowances.slice(0, 5).map((allowance: any) => (
                          <div
                            key={allowance.id}
                            className={`p-4 bg-white dark:bg-zinc-800 rounded-md mb-2.5 border-2 ${
                              allowance.riskLevel === 'high' ? 'border-red-200 dark:border-red-800' : 
                              allowance.riskLevel === 'medium' ? 'border-orange-200 dark:border-orange-800' : 'border-green-200 dark:border-green-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <strong className="text-zinc-900 dark:text-zinc-100">{allowance.tokenSymbol}</strong>
                              <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full text-white ${
                                allowance.riskLevel === 'high' ? 'bg-red-600' :
                                allowance.riskLevel === 'medium' ? 'bg-orange-600' : 'bg-green-600'
                              }`}>
                                {allowance.riskLevel.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                              Amount: <strong>{allowance.amount}</strong>
                            </div>
                            <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                              Spender: {allowance.spenderName}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-500">
                              Updated: {allowance.lastUpdated}
                            </div>
                          </div>
                        ))}
                        
                        {processedAllowances.length > 5 && (
                          <p className="text-center text-zinc-600 dark:text-zinc-400 text-sm mt-4">
                            Showing 5 of {processedAllowances.length} allowances
                          </p>
                        )}
                        
                        <div className="text-center mt-5">
                          <a
                            href={`https://revoke.cash/address/${address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2.5 px-5 bg-zinc-500 text-white no-underline rounded-md text-sm hover:bg-zinc-600 transition-colors"
                          >
                            View Full Analysis →
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <div className="text-5xl mb-4">🎉</div>
                        <h3 className="text-green-600 dark:text-green-400 mb-2.5 text-lg font-semibold">No Allowances Found</h3>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-5">Your wallet looks clean! No token approvals detected.</p>
                        <a
                          href={`https://revoke.cash/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-5 bg-zinc-500 text-white no-underline rounded-md text-sm hover:bg-zinc-600 transition-colors"
                        >
                          View Full Analysis →
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'share' && (
              <div className="text-center py-10">
                <div className="text-5xl mb-4">📢</div>
                <h3 className="mb-4 text-zinc-900 dark:text-zinc-100 text-lg font-semibold">Share Your Results</h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-5">
                  Share your wallet security on Farcaster!
                </p>
                <button
                  onClick={() => {
                    const text = `Just checked my wallet security with @revoke! 🔍\n\nWallet: ${address?.slice(0, 6)}...${address?.slice(-4)}\n\nCheck yours: https://revoke.cash`;
                    
                    const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
                    window.open(shareUrl, '_blank');
                  }}
                  className="py-3 px-6 bg-violet-500 text-white border-none rounded-md text-base font-medium cursor-pointer hover:bg-violet-600 transition-colors"
                >
                  Share on Farcaster 🟣
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      </div>
    </div>
  );
}

export default App;
