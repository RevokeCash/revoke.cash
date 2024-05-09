'use client';

import AddressSearchBox from 'components/common/AddressSearchBox';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const SearchBar = () => {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<string>('');

  return (
    <AddressSearchBox
      id="global-search"
      onSubmit={() => router.push(`/address/${value}?${searchParams.toString()}`)}
      onChange={(ev) => setValue(ev.target.value.trim())}
      value={value}
      placeholder={t('common.nav.search')}
      className="w-full max-w-3xl text-base sm:text-lg"
    />
  );
};

export default SearchBar;
