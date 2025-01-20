'use client';

import AddressSearchBox from 'components/common/AddressSearchBox';
import Button from 'components/common/Button';
import { useCsrRouter } from 'lib/i18n/csr-navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useAccount } from 'wagmi';

const SearchBar = () => {
  const t = useTranslations();
  const router = useCsrRouter();
  const [value, setValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const { address } = useAccount();
  const timerRef = useRef<NodeJS.Timeout>();

  const onFocus = useCallback(() => {
    clearTimeout(timerRef.current);
    setIsFocused(true);
  }, []);

  const onBlur = useCallback(() => {
    timerRef.current = setTimeout(() => setIsFocused(false), 200);
  }, []);

  const onClick = useCallback(() => {
    if (address) {
      setValue(address);
      router.push(`/address/${address}`, { retainSearchParams: ['chainId'] });
    }
  }, [address, router]);

  return (
    <div className="relative w-full">
      <AddressSearchBox
        id="global-search"
        onSubmit={() => router.push(`/address/${value}`, { retainSearchParams: ['chainId'] })}
        onChange={(ev) => setValue(ev.target.value.trim())}
        value={value}
        placeholder={t('common.nav.search')}
        className="w-full text-base sm:text-lg border-x-0 rounded-none border-zinc-400 dark:border-zinc-600 py-6 focus-within:ring-0 focus-within:border-black dark:focus-within:border-white"
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <div className={twMerge('absolute mt-2', (!isFocused || !address) && 'hidden')}>
        <Button style="secondary" size="md" onClick={onClick}>
          {t('common.buttons.check_connected_address')}
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;
