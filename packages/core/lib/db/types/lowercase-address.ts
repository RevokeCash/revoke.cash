import type { DriverValueEncoder } from 'drizzle-orm';
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

// The same convention for a whole list that a query binds as one array parameter (`= any($1::text[])`), where drizzle
// applies no column type: sql.param(addresses, lowercaseAddressArray)
export const lowercaseAddressArray: DriverValueEncoder<readonly Address[], string[]> = {
  mapToDriverValue: (addresses) => addresses.map((address) => address.toLowerCase()),
};
