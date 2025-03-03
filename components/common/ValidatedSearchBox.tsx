import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { type ChangeEventHandler, type FormEventHandler, type HTMLAttributes, useState } from 'react';
import Button from './Button';
import SearchBox from './SearchBox';
import Spinner from './Spinner';

interface ValidatedSearchBoxProps extends Omit<HTMLAttributes<HTMLInputElement>, 'onSubmit'> {
  onSubmit: (value: string) => void | Promise<void>;
  placeholder: string;
  validate: (value: string) => Promise<boolean>;
}

const ValidatedSearchBox = ({ onSubmit, placeholder, validate, ...props }: ValidatedSearchBoxProps) => {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleChange: ChangeEventHandler<HTMLInputElement> = async (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (!newValue.trim()) {
      setIsValid(null);
      return;
    }
    setIsValidating(true);
    const valid = await validate(newValue.trim());
    setIsValid(valid);
    setIsValidating(false);
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    setIsValidating(true);
    const valid = await validate(value.trim());
    setIsValid(valid);
    setIsValidating(false);
    if (valid) {
      onSubmit(value.trim());
    }
  };

  return (
    <SearchBox onSubmit={handleSubmit} onChange={handleChange} value={value} placeholder={placeholder} {...props}>
      {value && isValidating && <Spinner className="w-4 h-4" />}
      {value && !isValidating && isValid === false && <XMarkIcon className="w-6 h-6 text-red-500" />}
      {value && !isValidating && isValid && (
        <Button type="submit" variant="ghost" size="sm" aria-label="Submit">
          <ArrowRightCircleIcon className="w-6 h-6" />
        </Button>
      )}
    </SearchBox>
  );
};

export default ValidatedSearchBox;
