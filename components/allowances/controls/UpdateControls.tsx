import Button from 'components/common/Button';
import Input from 'components/common/Input';
import { TransactionSubmitted } from 'lib/interfaces';
import { waitForSubmittedTransactionConfirmation } from 'lib/utils';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';

interface Props {
  update: (newAllowance: string) => Promise<TransactionSubmitted>;
  disabled: boolean;
  defaultValue?: string;
  reset: () => void;
}

const UpdateControls = ({ disabled, update, defaultValue, reset }: Props) => {
  const t = useTranslations();
  const [value, setValue] = useState<string>(defaultValue ?? '0');
  const { execute, loading } = useAsyncCallback(() => waitForSubmittedTransactionConfirmation(update(value)));

  const callUpdate = async () => {
    await execute();
    reset();
  };

  return (
    <div className="flex gap-2">
      <Input
        size="sm"
        className="w-16"
        type="text"
        placeholder={defaultValue ?? '0'}
        onChange={(e) => setValue(e.target.value)}
        value={value}
      />
      <Button disabled={disabled} loading={loading} style="tertiary" size="sm" onClick={callUpdate} className="px-0">
        {loading ? t('common.buttons.updating') : t('common.buttons.update')}
      </Button>
      {!loading && (
        <Button style="tertiary" size="sm" onClick={reset} className="px-0">
          {t('common.buttons.cancel')}
        </Button>
      )}
    </div>
  );
};

export default UpdateControls;
