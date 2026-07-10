import type { HTMLAttributes, Ref } from 'react';

interface Props extends HTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
}

const FocusTrap = (props: Props) => {
  return <button aria-label="Focus Trap" tabIndex={-1} {...props} />;
};

export default FocusTrap;
