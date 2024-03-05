'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import Button from 'components/common/Button';
import { useProfile } from 'lib/hooks/useProfile';
import { useForm } from 'react-hook-form';
import { object, string } from 'yup';
import { SelectField } from './SelectField';

// Validation schema
export const newAlertRuleSchema = object({
  trigger: string().oneOf(['NEW_APPROVAL']).required('Trigger is required'),
  transport: string().oneOf(['EMAIL']).required('Transport method is required'),
});

export const AddAlertRuleForm = () => {
  const { addAlertRule } = useProfile();

  const { handleSubmit, control, formState } = useForm({
    resolver: yupResolver(newAlertRuleSchema),
    mode: 'onChange',
  });

  const createAlertRule = handleSubmit(async (data) => {
    // await addAlertRule(data);
  });

  return (
    <form onSubmit={createAlertRule} className="w-full">
      <SelectField
        name="trigger"
        label="Trigger"
        control={control}
        options={[{ value: 'NEW_APPROVAL', label: 'New Approval' }]}
      />
      <SelectField
        name="transport"
        label="Transport"
        control={control}
        options={[{ value: 'EMAIL', label: 'Email' }]}
      />

      <Button
        loading={formState.isSubmitting}
        disabled={!formState.isValid}
        size="md"
        className="border w-full mt-4"
        type="submit"
      >
        Create Alert Rule
      </Button>
    </form>
  );
};
