import { useState } from "react";
import { useChainId } from "wagmi";
import { Address } from "viem";
import { AllowanceCard } from "./AllowanceCard";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { EmptyState } from "../ui/EmptyState";
import { ShareButton } from "../farcaster/ShareButton";
import Button from "../common/MobileButton";
import { useEvents } from "@revoke-lib/hooks/ethereum/events/useEvents";
import { useAllowances } from "@revoke-lib/hooks/ethereum/useAllowances";

interface TokenAllowance {
  id: string;
  token: {
    address: Address;
    name: string;
    symbol: string;
    decimals: number;
  };
  spender: {
    address: Address;
    name?: string;
  };
  amount: string;
  value?: number;
  riskLevel: 'high' | 'medium' | 'low';
  lastUpdated: Date;
}

interface AllowancesDashboardProps {
  address: Address;
}

export const AllowancesDashboard = ({ address }: AllowancesDashboardProps) => {
  const chainId = useChainId();
  const [revoking, setRevoking] = useState<Set<string>>(new Set());

  // Get real blockchain events and allowances
  const { events, isLoading: eventsLoading } = useEvents(address, chainId);
  const { allowances: rawAllowances, isLoading: allowancesLoading } = useAllowances(address, events, chainId);

  const loading = eventsLoading || allowancesLoading;

  // Convert real allowances to our interface
  const allowances: TokenAllowance[] = (rawAllowances || [])
    .filter(allowance => allowance.payload) // Only show active allowances
    .map(allowance => {
      const payload = allowance.payload!;
      
      // Calculate risk level
      let riskLevel: 'high' | 'medium' | 'low' = 'low';
      
      // High risk: unlimited ERC20 approvals or NFT approvals for all
      if (payload.type === 'ERC20' && payload.amount === 2n ** 256n - 1n) {
        riskLevel = 'high';
      } else if (payload.type === 'ERC721_ALL') {
        riskLevel = 'high';
      } else if (payload.spenderData?.riskFactors && payload.spenderData.riskFactors.length > 0) {
        riskLevel = 'high';
      } else if (!payload.spenderData?.name) {
        riskLevel = 'medium'; // Unknown spender
      }

      // Format amount
      let amount = 'unknown';
      if (payload.type === 'ERC20') {
        if (payload.amount === 2n ** 256n - 1n) {
          amount = 'unlimited';
        } else {
          const decimals = allowance.metadata?.decimals || 18;
          const numericAmount = Number(payload.amount) / Math.pow(10, decimals);
          amount = numericAmount.toLocaleString(undefined, { maximumFractionDigits: 6 });
        }
      } else if (payload.type === 'ERC721_ALL') {
        amount = 'all NFTs';
      } else if (payload.type === 'ERC721_SINGLE') {
        amount = `Token #${payload.tokenId}`;
      }

      // Calculate USD value
      let value: number | undefined;
      if (allowance.metadata?.price && payload.type === 'ERC20' && amount !== 'unlimited') {
        try {
          const numericAmount = parseFloat(amount.replace(/,/g, ''));
          value = numericAmount * allowance.metadata.price;
        } catch (error) {
          value = undefined;
        }
      }

      return {
        id: `${allowance.contract.address}-${payload.spender}-${payload.type}`,
        token: {
          address: allowance.contract.address,
          name: (allowance as any).name || 'Unknown Token',
          symbol: allowance.metadata.symbol || 'UNKNOWN',
          decimals: allowance.metadata.decimals || 18,
        },
        spender: {
          address: payload.spender,
          name: payload.spenderData?.name,
        },
        amount,
        value,
        riskLevel,
        lastUpdated: new Date((payload.lastUpdated.timestamp || 0) * 1000),
      };
    })
    .sort((a, b) => {
      // Sort by risk level first (high risk first)
      const riskOrder = { high: 0, medium: 1, low: 2 };
      if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      }
      // Then by value (highest first)
      return (b.value || 0) - (a.value || 0);
    });

  const handleRevoke = async (allowanceId: string) => {
    setRevoking(prev => new Set(prev).add(allowanceId));
    
    try {
      // Find the allowance to revoke
      const allowance = allowances.find(a => a.id === allowanceId);
      if (!allowance) return;

      // For now, just simulate the revoke - implementing actual revoke would require
      // wallet connection and transaction submission which is complex for the mini-app
      console.log('Revoking allowance:', allowance);
      
      // Simulate transaction time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would:
      // 1. Get the allowance payload from rawAllowances
      // 2. Use the revoke functionality from the main app
      // 3. Wait for transaction confirmation
      // 4. Refresh the allowances data
      
    } catch (error) {
      console.error('Failed to revoke allowance:', error);
    } finally {
      setRevoking(prev => {
        const newSet = new Set(prev);
        newSet.delete(allowanceId);
        return newSet;
      });
    }
  };

  const handleBatchRevoke = async () => {
    const highRiskAllowances = allowances.filter(a => a.riskLevel === 'high');
    
    for (const allowance of highRiskAllowances) {
      setRevoking(prev => new Set(prev).add(allowance.id));
    }
    
    try {
      // Simulate batch revoke - in real implementation this would use
      // the batch revoke functionality from the main Revoke.cash app
      console.log('Batch revoking high-risk allowances:', highRiskAllowances);
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error('Failed to batch revoke:', error);
    } finally {
      setRevoking(new Set());
    }
  };

  const highRiskCount = allowances.filter(a => a.riskLevel === 'high').length;
  const totalValue = allowances.reduce((sum, a) => sum + (a.value || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner />
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">Scanning your wallet...</p>
      </div>
    );
  }

  if (allowances.length === 0) {
    return (
      <EmptyState
        title="No allowances found"
        description="Your wallet looks clean! No token approvals detected."
        action={
          <Button
            style="primary"
            size="md"
            onClick={() => window.open('https://revoke.cash', '_blank')}
          >
            View Full Analysis
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Health Summary */}
      <div className="bg-white dark:bg-black rounded-lg p-4 border border-black dark:border-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Wallet Health
          </h2>
          {highRiskCount > 0 && (
            <Button
              style="primary"
              size="sm"
              onClick={handleBatchRevoke}
              disabled={revoking.size > 0}
            >
              Revoke High Risk ({highRiskCount})
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Allowances</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {allowances.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">At Risk Value</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              ${totalValue.toLocaleString()}
            </p>
          </div>
        </div>

        {highRiskCount > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              ⚠️ You have {highRiskCount} high-risk allowance{highRiskCount > 1 ? 's' : ''} that should be revoked immediately.
            </p>
          </div>
        )}
      </div>

      {/* Allowances List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Token Allowances
        </h3>
        
        {allowances.map((allowance) => (
          <AllowanceCard
            key={allowance.id}
            allowance={allowance}
            onRevoke={() => handleRevoke(allowance.id)}
            isRevoking={revoking.has(allowance.id)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6">
        <ShareButton
          text={`Just scanned my wallet with @revoke! 🔍\n\n${allowances.length} token allowances found\n${highRiskCount > 0 ? `⚠️ ${highRiskCount} high-risk approvals` : '✅ No high-risk approvals'}\n\nCheck your wallet: https://revoke.cash`}
          style="primary"
          size="lg"
        >
          Share Results 📢
        </ShareButton>
        
        <Button
          style="secondary"
          size="lg"
          onClick={() => window.open(`https://revoke.cash/address/${address}`, '_blank')}
        >
          View Detailed Analysis →
        </Button>
      </div>
    </div>
  );
};