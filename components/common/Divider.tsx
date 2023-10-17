import { twMerge } from 'tailwind-merge';

interface Props {
  className?: string;
}

const Divider = ({ className }: Props) => (
  <div className={twMerge('border w-full border-zinc-200 dark:border-zinc-800', className)} />
);

export default Divider;
