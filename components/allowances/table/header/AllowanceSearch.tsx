import { ArrowRightCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import Button from 'components/common/Button';
import useTranslation from 'next-translate/useTranslation';
import { FormEventHandler, useState } from 'react';

interface Props {
  filterByContract: (contract: string | null) => void;
}

const AllowanceSearch = ({ filterByContract }: Props) => {
  const { t } = useTranslation();

  const [value, setValue] = useState<string>('');

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!value) return;
    filterByContract(value);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="h-9 flex gap-2 items-center w-full max-w-3xl border border-black dark:border-white rounded-lg px-3 text-base sm:text-lg font-medium focus-within:ring-1 focus-within:ring-black dark:focus-within:ring-white"
    >
      <MagnifyingGlassIcon className="w-6 h-6" />
      <input
        className="grow focus-visible:outline-none address-input bg-transparent"
        placeholder={t('common:allowance_search.title')}
        value={value}
        onChange={(ev) => setValue(ev.target.value.trim())}
      />
      {value && (
        <Button
          style="tertiary"
          onClick={() => {
            setValue('');
            filterByContract(null);
          }}
          size="none"
        >
          <XCircleIcon className="w-6 h-6" />
        </Button>
      )}
      {value && (
        <Button style="tertiary" size="none">
          <ArrowRightCircleIcon className="w-6 h-6" />
        </Button>
      )}
    </form>
  );
};

export default AllowanceSearch;
