import { CheckIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useQuery } from '@tanstack/react-query';
import Spinner from 'components/common/Spinner';
import { parseInputAddress } from 'lib/utils';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import { FormEventHandler, useState } from 'react';

const SearchBar = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const [value, setValue] = useState<string>();

  const { data: isValid, isLoading: validating } = useQuery({
    queryKey: ['validate', value],
    queryFn: async () => !!(await parseInputAddress(value)),
    enabled: !!value,
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!isValid || !value) return;
    router.push(`/address/${value}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="h-9 flex gap-2 items-center w-full max-w-xl border border-black rounded-lg px-3 text-lg font-medium focus-within:ring-1 focus-within:ring-black bg-white"
    >
      <MagnifyingGlassIcon className="w-6 h-6" />
      <input
        className="w-full focus:outline-none address-input"
        placeholder={t('common:nav.search')}
        onChange={(ev) => setValue(ev.target.value)}
      />
      {value && validating && <Spinner className="w-4 h-4" />}
      {value && !validating && !isValid && <XMarkIcon className="w-6 h-6 text-red-500" />}
      {value && !validating && isValid && <CheckIcon className="w-6 h-6 text-green-500" />}
    </form>
  );
};

export default SearchBar;
