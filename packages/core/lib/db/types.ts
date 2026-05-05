import { customType } from 'drizzle-orm/pg-core';
import { type Address, getAddress } from 'viem';

// Custom Postgres column type that enforces the project-wide convention:
//   - in-memory:    checksummed `Address` (EIP-55)
//   - on disk:      lowercase string
//
// Drizzle's `toDriver` runs on every write (INSERT/UPDATE values, WHERE-clause comparison
// values) so addresses always land in storage lowercased. `fromDriver` runs on every SELECT,
// running `getAddress(...)` so reads surface as checksummed `Address` values.
//
// Used in place of `text('column').$type<Address>()` for any column that holds a 20-byte
// EVM address. Hash columns (`transactionHash` etc.) are 32-byte hex with no EIP-55 checksum
// concept; they stay as plain `text` since viem outputs them lowercase already.
export const lowercaseAddress = customType<{ data: Address; driverData: string }>({
  dataType() {
    return 'text';
  },
  toDriver(value: Address): string {
    return value.toLowerCase();
  },
  fromDriver(value: string): Address {
    return getAddress(value);
  },
});
