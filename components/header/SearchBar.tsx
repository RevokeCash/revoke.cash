import AddressSearchBox from 'components/common/AddressSearchBox';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import { useState } from 'react';

interface Props {
  onSubmit?: (address: string) => void;
}

const SearchBar = (props: Props) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [value, setValue] = useState<string>('');

  return (
    <AddressSearchBox
      onSubmit={() => router.push(`/address/${value}`)}
      onChange={(ev) => setValue(ev.target.value.trim())}
      value={value}
      placeholder={t('common:nav.search')}
      className="w-full max-w-3xl text-base sm:text-lg"
    />
  );
};

export default SearchBar;
