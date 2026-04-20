import type { RequestExecutionPermissionsReturnType } from '@metamask/smart-accounts-kit/actions';
import type { Address, Hex } from 'viem';

/** A single permission result from MetaMask's ERC-7715 wallet methods */
export type WalletPermissionResult = RequestExecutionPermissionsReturnType[number];
export type WalletPermissionRules = WalletPermissionResult['rules'];

export interface AutoRevokePermission {
  address: Address;
  chainId: number;
  permissionContext: Hex;
  delegationManager: Address;
  expiresAt: string;
  isActive: boolean;
}

export type RiskSensitivity = 'exploits_only' | 'high' | 'medium';

export interface AutoRevokeRules {
  riskDetectionEnabled: boolean;
  riskSensitivity: RiskSensitivity;
  staleApprovalEnabled: boolean;
  staleApprovalThresholdDays: number;
}

export type AutoRevokeRulesSource =
  | { type: 'custom' }
  | { type: 'subscription'; subscriptionId: string; planName: string; ownerAddress: Address };

export interface AutoRevokeAddressRulesConfig {
  rulesSource: AutoRevokeRulesSource;
  effectiveRules: AutoRevokeRules;
  customRules: AutoRevokeRules;
  availableSubscriptions: Array<{
    subscriptionId: string;
    planName: string;
    ownerAddress: Address;
  }>;
}
