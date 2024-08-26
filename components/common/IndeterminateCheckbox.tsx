import { HTMLProps, useEffect, useRef } from 'react';

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

  return <input type="checkbox" ref={ref} className={className + ' cursor-pointer'} {...rest} />;
};

export default IndeterminateCheckbox;
