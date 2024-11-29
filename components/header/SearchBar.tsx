'use client';

import AddressSearchBox from 'components/common/AddressSearchBox';
import { useCsrRouter } from 'lib/i18n/csr-navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const SearchBar = () => {
  const t = useTranslations();
  const router = useCsrRouter();
  const [value, setValue] = useState<string>('');

  return (
    <AddressSearchBox
      id="global-search"
      onSubmit={() => router.push(`/address/${value}`, { retainSearchParams: ['chainId'] })}
      onChange={(ev) => setValue(ev.target.value.trim())}
      value={value}
      placeholder={t('common.nav.search')}
      className="w-full text-base sm:text-lg border-x-0 rounded-none border-zinc-400 dark:border-zinc-600 py-6 focus-within:ring-0 focus-within:border-black dark:focus-within:border-white"
    />
  );
};

export default SearchBar;
