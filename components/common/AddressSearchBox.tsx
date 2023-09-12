import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useQuery } from '@tanstack/react-query';
import { ChangeEventHandler, FormEventHandler, HTMLAttributes } from 'react';
import Button from './Button';
import SearchBox from './SearchBox';
import Spinner from './Spinner';
import { parseInputAddress } from 'lib/utils/whois';

interface Props extends Omit<HTMLAttributes<HTMLInputElement>, 'onSubmit'> {
  onSubmit: FormEventHandler<HTMLFormElement>;
  onChange: ChangeEventHandler<HTMLInputElement>;
  value: string;
  placeholder: string;
  className?: string;
}

const AddressSearchBox = ({ onSubmit, onChange, value, placeholder, className, ...props }: Props) => {
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
    onSubmit(event);
  };

  return (
    <SearchBox
      onSubmit={handleSubmit}
      onChange={onChange}
      value={value}
      placeholder={placeholder}
      className={className}
      {...props}
    >
      {value && validating && <Spinner className="w-4 h-4" />}
      {value && !validating && !isValid && <XMarkIcon className="w-6 h-6 text-red-500" />}
      {value && !validating && isValid && (
        <Button style="tertiary" size="none" aria-label="Check Address">
          <ArrowRightCircleIcon className="w-6 h-6" />
        </Button>
      )}
    </SearchBox>
  );
};

export default AddressSearchBox;
