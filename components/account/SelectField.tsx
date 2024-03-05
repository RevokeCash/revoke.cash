import clsx from 'clsx';
import { Control, useController } from 'react-hook-form';

type Option = {
  value: string | number;
  label: string;
};

type Props = {
  name: string;
  control: Control;
  label?: string;
  options: Option[];
  className?: string;
};

export const SelectField = ({ label, options, className, ...props }: Props) => {
  const controller = useController({
    name: props.name,
    control: props.control,
  });

  return (
    <div className={clsx('h-20', className)}>
      {label && (
        <label htmlFor={props.name} className="block text-sm font-semibold">
          {label}
        </label>
      )}
      <select
        {...controller.field}
        {...props}
        className={clsx(
          controller.fieldState.error && controller.fieldState.isTouched && 'border-red-500 bg-red-100',
          'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm appearance-none bg-white focus:outline-none focus:ring-0 sm:text-sm',
          className,
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {controller.fieldState.error && controller.fieldState.isTouched && (
        <div className="text-red-500 text-xs font-bold mt-1">{controller.fieldState.error.message}</div>
      )}
    </div>
  );
};
