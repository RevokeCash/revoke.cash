import useTranslation from 'next-translate/useTranslation';
import { useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import Button from './Button';

interface Props {
  update: (newAllowance: string) => Promise<void>;
  disabled: boolean;
}

const UpdateControls = ({ disabled, update }: Props) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<string>('0');
  const { execute, loading } = useAsyncCallback(() => update(value));

  return (
    <div className="flex">
      <input
        className="border-y border-l border-black rounded rounded-r-none w-16 px-1.5 focus:outline-black"
        type="text"
        placeholder="0"
        onChange={(e) => setValue(e.target.value)}
      />
      <Button disabled={loading || disabled} style="secondary" size="sm" onClick={execute} className="rounded-l-none">
        {loading ? t('common:buttons.updating') : t('common:buttons.update')}
      </Button>
    </div>
  );
};

export default UpdateControls;
