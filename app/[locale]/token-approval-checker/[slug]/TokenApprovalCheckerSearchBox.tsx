'use client';

import AddressSearchBox from 'components/common/AddressSearchBox';
import { useCsrRouter } from 'lib/i18n/csr-navigation';
import { NextPage } from 'next';
import { useState } from 'react';

interface Props {
  chainId: number;
  placeholder: string;
}

const TokenApprovalCheckerSearchBox: NextPage<Props> = ({ chainId, placeholder }) => {
  const router = useCsrRouter();
  const [value, setValue] = useState<string>('');

  return (
    <AddressSearchBox
      id="tac-search"
      onSubmit={() => router.push(`/address/${value}?chainId=${chainId}`)}
      onChange={(ev) => setValue(ev.target.value.trim())}
      value={value}
      placeholder={placeholder}
      className="w-full max-w-3xl text-base sm:text-lg"
    />
  );
};

export default TokenApprovalCheckerSearchBox;
