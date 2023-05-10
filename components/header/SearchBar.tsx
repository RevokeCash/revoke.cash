import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useQuery } from '@tanstack/react-query';
import Button from 'components/common/Button';
import SearchBox from 'components/common/SearchBox';
import Spinner from 'components/common/Spinner';
import { parseInputAddress } from 'lib/utils';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import { FormEventHandler, useState } from 'react';

interface Props {
  onSubmit?: (address: string) => void;
}

const SearchBar = (props: Props) => {
  const { t } = useTranslation();
  const router = useRouter();

  const [value, setValue] = useState<string>('');

  const { data: isValid, isLoading: validating } = useQuery({
    queryKey: ['validate', value],
    queryFn: async () => !!(await parseInputAddress(value)),
    enabled: !!value,
    // Chances of this data changing while the user is on the page are very slim
    staleTime: Infinity,
  });

  // TODO: Handle case where submitted while still validating
  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!isValid || !value) return;

    props.onSubmit ? props.onSubmit(value) : router.push(`/address/${value}`);

    setValue('');
  };

  return (
    <SearchBox
      onSubmit={handleSubmit}
      onChange={(ev) => setValue(ev.target.value.trim())}
      value={value}
      placeholder={t('common:nav.search')}
      className="w-full max-w-3xl text-base sm:text-lg"
    >
      {value && validating && <Spinner className="w-4 h-4" />}
      {value && !validating && !isValid && <XMarkIcon className="w-6 h-6 text-red-500" />}
      {value && !validating && isValid && (
        <Button style="tertiary" size="none">
          <ArrowRightCircleIcon className="w-6 h-6" />
        </Button>
      )}
    </SearchBox>
  );
};

export default SearchBar;
