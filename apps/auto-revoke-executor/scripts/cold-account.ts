// Cold smart-account construction + delegation signing, shared by the ceremony and the kill switch.
// Both must build the cold account identically (same deploy params + salt) so they derive the same
// CREATE2 address — keeping this in one place prevents drift.
import {
  createDelegation,
  Implementation,
  ScopeType,
  type SmartAccountsEnvironment,
  type ToMetaMaskSmartAccountReturnType,
  toMetaMaskSmartAccount,
} from '@metamask/smart-accounts-kit';
import { generateSalt } from '@metamask/smart-accounts-kit/utils';
import { type Address, getAddress, type PublicClient } from 'viem';
import type { SignedDelegation } from './delegations';
import type { LedgerColdSigner } from './ledger-cold-signer';

export type ColdSmartAccount = ToMetaMaskSmartAccountReturnType<Implementation.MultiSig>;

// Deterministic salt so the cold address is stable across runs and chains.
export const COLD_DEPLOY_SALT = '0x';
export const REDEEM_DELEGATIONS_SIGNATURE = 'redeemDelegations(bytes[],bytes32[],bytes[])';
export const DISABLE_DELEGATION_SIGNATURE =
  'disableDelegation((address,address,bytes32,(address,bytes,bytes)[],uint256,bytes))';

// The cold wallet: a MetaMask MultiSig DeleGator with the Ledger key as its sole signer (threshold
// 1). Address is deterministic (CREATE2 from these deploy params + salt), so identical on every chain.
export const buildColdSmartAccount = (publicClient: PublicClient, cold: LedgerColdSigner) =>
  toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.MultiSig,
    deployParams: [[cold.address], 1n],
    deploySalt: COLD_DEPLOY_SALT,
    signer: [{ account: cold.account }],
  });

// Sign a root delegation from the cold smart account, scoped (via a function-call caveat) to a single
// method on the DelegationManager. The Ledger signs the EIP-712 payload as the MultiSig signer.
export const signColdDelegation = async (
  coldSmartAccount: ColdSmartAccount,
  delegate: Address,
  selectorSignature: string,
  environment: SmartAccountsEnvironment,
): Promise<SignedDelegation> => {
  const delegation = createDelegation({
    from: coldSmartAccount.address,
    to: delegate,
    environment,
    scope: {
      type: ScopeType.FunctionCall,
      targets: [getAddress(environment.DelegationManager)],
      selectors: [selectorSignature],
    },
    salt: generateSalt(),
  });

  const signature = await coldSmartAccount.signDelegation({ delegation });
  return { ...delegation, signature };
};
