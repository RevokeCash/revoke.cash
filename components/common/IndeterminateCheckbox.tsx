import { HTMLProps, useEffect, useRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props extends HTMLProps<HTMLInputElement> {
  indeterminate?: boolean;
}

const IndeterminateCheckbox = ({ indeterminate, className = '', ...rest }: Props) => {
  const ref = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className={twMerge(className, 'cursor-pointer accent-brand', rest.disabled && 'cursor-not-allowed')}
      {...rest}
    />
  );
};

export default IndeterminateCheckbox;
