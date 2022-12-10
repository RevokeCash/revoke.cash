import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import type { FormEventHandler } from 'react';

interface SearchFormElement extends HTMLFormElement {
  elements: SearchFormCollection;
}

interface SearchFormCollection extends HTMLFormControlsCollection {
  searchBox: HTMLInputElement;
}

// TODO ENS/UNS validation before submitting
const SearchBar = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const handleSubmit: FormEventHandler<SearchFormElement> = async (event) => {
    event.preventDefault();
    const address = event.currentTarget.elements.searchBox.value;
    router.push(`/address/${address}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-10 w-full text-center text-lg font-medium max-w-xl">
      <input
        className="border border-black rounded-md mx-auto w-full px-2 py-1 text-lg font-medium focus:outline-black address-input"
        placeholder={t('dashboard:address_input')}
        id="searchBox"
      />
    </form>
  );
};

export default SearchBar;
