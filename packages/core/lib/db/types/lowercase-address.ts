import { customType } from 'drizzle-orm/pg-core';
import { type Address, getAddress } from 'viem';

// Custom Postgres column type that enforces the project-wide convention:
//   - in-memory:    checksummed `Address` (EIP-55)
//   - on disk:      lowercase string
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
