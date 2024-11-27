'use client';

import AddressSearchBox from 'components/common/AddressSearchBox';
import { useRouter } from 'lib/i18n/navigation';
import { NextPage } from 'next';
import { useState } from 'react';

interface Props {
  chainId: number;
  placeholder: string;
}

const TokenApprovalCheckerSearchBox: NextPage<Props> = ({ chainId, placeholder }) => {
  const router = useRouter();
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
