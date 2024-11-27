import { ForwardedRef, HTMLAttributes, forwardRef } from 'react';

interface Props extends HTMLAttributes<HTMLButtonElement> {}

const FocusTrap = (props: Props, ref: ForwardedRef<HTMLButtonElement>) => {
  return <button aria-label="Focus Trap" tabIndex={-1} {...props} ref={ref} />;
};

export default forwardRef(FocusTrap);
