import { Address } from "viem";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import Button from "../common/MobileButton";

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

interface AllowanceCardProps {
  allowance: TokenAllowance;
  onRevoke: () => void;
  isRevoking: boolean;
}

export const AllowanceCard = ({ allowance, onRevoke, isRevoking }: AllowanceCardProps) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  const formatAmount = (amount: string) => {
    if (amount === 'unlimited') {
      return 'Unlimited';
    }
    return amount;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      return 'Today';
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)} months ago`;
    } else {
      return `${Math.floor(diffDays / 365)} years ago`;
    }
  };

  return (
    <div className="bg-white dark:bg-black rounded-lg p-4 border border-black dark:border-white">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {allowance.token.symbol}
            </h4>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(allowance.riskLevel)}`}>
              {allowance.riskLevel} risk
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="font-medium">{formatAmount(allowance.amount)}</span>
            </div>
            
            {allowance.value && (
              <div className="flex justify-between">
                <span>Value:</span>
                <span className="font-medium">${allowance.value.toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span>Spender:</span>
              <span className="font-medium truncate max-w-32" title={allowance.spender.name || allowance.spender.address}>
                {allowance.spender.name || `${allowance.spender.address.slice(0, 6)}...${allowance.spender.address.slice(-4)}`}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Last updated:</span>
              <span className="font-medium">{formatDate(allowance.lastUpdated)}</span>
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex-shrink-0">
          <Button
            style="primary"
            size="sm"
            onClick={onRevoke}
            disabled={isRevoking}
            loading={isRevoking}
          >
            Revoke
          </Button>
        </div>
      </div>
    </div>
  );
};