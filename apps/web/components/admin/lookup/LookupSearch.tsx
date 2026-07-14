'use client';

import { parseInputAddress } from '@revoke.cash/core/whois';
import AddressSearchBox from 'components/common/AddressSearchBox';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const LookupSearch = () => {
  const router = useRouter();
  const [value, setValue] = useState('');

  // AddressSearchBox only submits once the input parses to a valid address or ENS name
  const handleSubmit = async () => {
    const parsedAddress = await parseInputAddress(value);
    if (!parsedAddress) return;
    router.push(`/admin/lookup/${parsedAddress}`);
  };

  return (
    <AddressSearchBox
      onSubmit={handleSubmit}
      onChange={(event) => setValue(event.target.value.trim())}
      value={value}
      placeholder="Search by address or ENS name"
      className="w-full max-w-xl"
    />
  );
};

export default LookupSearch;
