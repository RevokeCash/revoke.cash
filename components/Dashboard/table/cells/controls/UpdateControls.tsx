import Button from 'components/common/Button';
import useTranslation from 'next-translate/useTranslation';
import { useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';

interface Props {
  update: (newAllowance: string) => Promise<void>;
  disabled: boolean;
  defaultValue?: string;
}

const UpdateControls = ({ disabled, update, defaultValue }: Props) => {
  const { t } = useTranslation();
  const [value, setValue] = useState<string>(defaultValue ?? '0');
  const { execute, loading } = useAsyncCallback(() => update(value));

  return (
    <div className="flex">
      <input
        className="border-y border-l border-black rounded rounded-r-none w-16 px-1.5 focus:outline-black"
        type="text"
        placeholder={defaultValue ?? '0'}
        onChange={(e) => setValue(e.target.value)}
        value={value}
      />
      <Button disabled={loading || disabled} style="secondary" size="sm" onClick={execute} className="rounded-l-none">
        {loading ? t('common:buttons.updating') : t('common:buttons.update')}
      </Button>
    </div>
  );
};

export default UpdateControls;
