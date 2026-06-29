// Shapes shared between the ceremony (which writes them) and the kill switch (which reads them).
import type { Address, Hex } from 'viem';

export interface SignedDelegation {
  delegate: Address;
  delegator: Address;
  authority: Hex;
  caveats: Array<{ enforcer: Address; terms: Hex; args: Hex }>;
  salt: Hex;
  signature: Hex;
}

// Per chain the ceremony writes the signed cold delegation (the executor's permissionContext).
// The kill switch reads it to know which delegation to disable; it signs its own `cold -> Ledger EOA`
// disable delegation on the spot, so nothing kill-switch-specific is stored here.
export type CeremonyOutput = Record<number, SignedDelegation>;

export const DEFAULT_DELEGATIONS_PATH = 'src/config/cold-delegations.json';
