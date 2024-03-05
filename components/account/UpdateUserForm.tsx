import { yupResolver } from '@hookform/resolvers/yup';
import Button from 'components/common/Button';
import { useProfile } from 'lib/hooks/useProfile';
import { useForm } from 'react-hook-form';
import { object, string } from 'yup';
import { TextField } from './TextField';

const schema = object({
  email_address: string().email().required(),
});

export const UpdateUserForm = () => {
  const { update, data } = useProfile();

  const { handleSubmit, control, formState, setFocus } = useForm({
    resolver: yupResolver(schema, {}, { mode: 'sync' }),
    mode: 'all',
    values: {
      email_address: data?.email_address,
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    await update(data);
  });

  return (
    <form onSubmit={onSubmit} className="w-full">
      <TextField name="email_address" label="Email" control={control} />

      <Button
        loading={formState.isSubmitting}
        disabled={formState.isValid == false || formState.isSubmitting || formState.isDirty == false}
        size="md"
        className="border w-full"
        type="submit"
      >
        Update
      </Button>
    </form>
  );
};
