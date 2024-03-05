import clsx from 'clsx';
import { InputHTMLAttributes } from 'react';
import { Control, useController } from 'react-hook-form';

type Props = {
  name: string;
  control: Control;
  label?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export const TextField = ({ label, className, ...props }: Props) => {
  const controller = useController({
    name: props.name,
    control: props.control,
  });

  return (
    <div className={clsx('h-20', className)}>
      {label && (
        <label htmlFor={props.name} className="block text-sm font-semibold ">
          {label}
        </label>
      )}
      <input
        {...controller.field}
        {...props}
        className={clsx(
          controller.fieldState.error && controller.fieldState.isTouched && 'border-red-500 bg-red-100',
          'appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm',
          className,
        )}
      />
      {controller.fieldState.error && controller.fieldState.isTouched && (
        <div className="text-red-500 text-xs font-bold mt-1">{controller.fieldState.error.message}</div>
      )}
    </div>
  );
};
