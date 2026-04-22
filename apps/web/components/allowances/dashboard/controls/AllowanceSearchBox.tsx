'use client';

import { XCircleIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import FocusTrap from 'components/common/FocusTrap';
import SearchBox from 'components/common/SearchBox';
import useDebouncedValue from 'lib/hooks/useDebouncedValue';
import { removeSearchParam } from 'lib/i18n/csr-navigation';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type ChangeEventHandler, useEffect, useState } from 'react';

interface Props {
  onSearchValuesChange: (values: string[]) => void;
  id?: string;
}

const AllowanceSearchBox = ({ onSearchValuesChange, id = 'spender-search' }: Props) => {
  const searchParams = useSearchParams()!;
  const t = useTranslations();
  const [inputValue, setInputValue] = useState<string>('');
  const [searchValue, { flushWith }] = useDebouncedValue(inputValue, 200);

  // Allow passing in a spenderSearch query param to pre-populate the search box (cleared on mount)
  // Note that this should be carefully tested with the query param handling in AddressPageContext.tsx when updated
  useEffect(() => {
    const spenderSearch = searchParams.get('spenderSearch');
    if (!spenderSearch) return;
    setInputValue(spenderSearch);

    removeSearchParam('spenderSearch');
  }, [searchParams]);

  useEffect(() => {
    const values = searchValue
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    onSearchValuesChange(values);
  }, [searchValue, onSearchValuesChange]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setInputValue(event.target.value);
  };

  const resetButton = (
    <Button
      style="tertiary"
      onClick={() => {
        setInputValue('');
        flushWith('');
      }}
      size="none"
    >
      <XCircleIcon className="w-6 h-6" />
    </Button>
  );

  return (
    <SearchBox
      id={id}
      onSubmit={(event) => event.preventDefault()}
      onChange={handleChange}
      value={inputValue}
      placeholder={t('address.search.spender')}
      className="w-full"
    >
      <FocusTrap />
      {inputValue.trim().length > 0 && resetButton}
    </SearchBox>
  );
};

export default AllowanceSearchBox;
