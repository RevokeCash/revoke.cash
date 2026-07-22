'use client';

import Href from 'components/common/Href';
import Label from 'components/common/Label';
import { useNameLookup } from 'lib/hooks/ethereum/useNameLookup';
import type { Address } from 'viem';

interface Props {
  address: Address;
  children?: React.ReactNode;
}

const AddressRow = ({ address, children }: Props) => {
  const { domainName } = useNameLookup(address);

  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="flex items-center gap-2 text-sm min-w-0">
        <Href
          href={`/address/${address}`}
          router
          underline="hover"
          className="font-mono text-zinc-500 visited:text-zinc-500 dark:text-zinc-400 dark:visited:text-zinc-400 truncate"
        >
          {address}
        </Href>
        {domainName && (
          <Label className="shrink-0 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">{domainName}</Label>
        )}
      </div>
      {children}
    </div>
  );
};

export default AddressRow;
