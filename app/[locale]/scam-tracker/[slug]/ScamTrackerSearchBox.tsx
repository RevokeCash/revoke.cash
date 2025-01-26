'use client';

import { XMarkIcon } from '@heroicons/react/24/solid';
import Button from 'components/common/Button';
import Loader from 'components/common/Loader';
import SearchBox from 'components/common/SearchBox';
import { useState } from 'react';
import type { FormEventHandler, HTMLAttributes } from 'react';

interface Props extends Omit<HTMLAttributes<HTMLInputElement>, 'onSubmit'> {
  onSubmit: (hash: string) => void;
  placeholder?: string;
}

const isValidHash = (hash: string) => /^0x([A-Fa-f0-9]{64})$/.test(hash);

//Make scam-tracker json file for the writings for the scam-tracker
const ScamTrackerSearchBox = ({ onSubmit, placeholder = 'Enter Ethereum transaction hash', ...props }: Props) => {
  const [value, setValue] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (value.trim() && isValidHash(value.trim())) {
      setIsValidating(true);
      // Simulate validation delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsValidating(false);
      onSubmit(value.trim());
    }
  };

  const isValid = isValidHash(value);

  return (
    <SearchBox
      onSubmit={handleSubmit}
      onChange={(e) => setValue(e.target.value)}
      value={value}
      placeholder={placeholder}
      {...props}
    >
      {value && isValidating && <Loader isLoading={true} loadingMessage="Validating..." />}{' '}
      {value && !isValidating && !isValid && <XMarkIcon className="w-6 h-6 text-red-500" />}
      {value && !isValidating && isValid && (
        <Button type="submit" variant="ghost" size="sm" aria-label="Check Transaction">
          # Add Button Track funds from common.button.json here
        </Button>
      )}
    </SearchBox>
  );
};

export default ScamTrackerSearchBox;
