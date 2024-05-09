'use client';

import AddressSearchBox from 'components/common/AddressSearchBox';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const SearchBar = () => {
  const t = useTranslations();
  const router = useRouter();
  const [value, setValue] = useState<string>('');

  return (
    <AddressSearchBox
      id="global-search"
      onSubmit={() => router.push(`/address/${value}${location.search}`)}
      onChange={(ev) => setValue(ev.target.value.trim())}
      value={value}
      placeholder={t('common.nav.search')}
      className="w-full max-w-3xl text-base sm:text-lg"
    />
  );
};

export default SearchBar;
