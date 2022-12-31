import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useQuery } from '@tanstack/react-query';
import Button from 'components/common/Button';
import Spinner from 'components/common/Spinner';
import { parseInputAddress } from 'lib/utils';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import { FormEventHandler, useState } from 'react';

const SearchBar = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const [value, setValue] = useState<string>('');

  const { data: isValid, isLoading: validating } = useQuery({
    queryKey: ['validate', value],
    queryFn: async () => !!(await parseInputAddress(value)),
    enabled: !!value,
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  // TODO: Handle case where submitted while still validating
  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!isValid || !value) return;
    router.push(`/address/${value}`);
    setValue('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="h-9 flex gap-2 items-center w-full max-w-3xl border border-black dark:border-white rounded-lg px-3 text-xs sm:text-lg font-medium focus-within:ring-1 focus-within:ring-black"
    >
      <MagnifyingGlassIcon className="w-6 h-6" />
      <input
        className="grow focus-visible:outline-none address-input bg-transparent"
        placeholder={t('common:nav.search')}
        value={value}
        onChange={(ev) => setValue(ev.target.value)}
      />
      {value && validating && <Spinner className="w-4 h-4" />}
      {value && !validating && !isValid && <XMarkIcon className="w-6 h-6 text-red-500" />}
      {value && !validating && isValid && (
        <Button style="tertiary" size="none">
          <ArrowRightCircleIcon className="w-6 h-6" />
        </Button>
      )}
    </form>
  );
};

export default SearchBar;
