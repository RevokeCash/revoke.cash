import Button from 'components/common/Button';
import useTranslation from 'next-translate/useTranslation';
import { useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';

interface Props {
  update: (newAllowance: string) => Promise<void>;
  disabled: boolean;
  defaultValue?: string;
  reset: () => void;
}

const UpdateControls = ({ disabled, update, defaultValue, reset }: Props) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<string>(defaultValue ?? '0');
  const { execute, loading } = useAsyncCallback(() => update(value));

  const callUpdate = async () => {
    await execute();
    reset();
  };

  return (
    <div className="flex gap-1">
      <input
        className="border border-black rounded w-16 px-1.5 focus:outline-black"
        type="text"
        placeholder={defaultValue ?? '0'}
        onChange={(e) => setValue(e.target.value)}
        value={value}
      />
      <Button disabled={loading || disabled} style="tertiary" size="sm" onClick={callUpdate}>
        {loading ? t('common:buttons.updating') : t('common:buttons.update')}
      </Button>
      {!loading && (
        <Button style="tertiary" size="sm" onClick={reset}>
          Cancel
        </Button>
      )}
    </div>
  );
};

export default UpdateControls;
