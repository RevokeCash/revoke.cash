import { classNames } from 'lib/utils/styles';

interface Props {
  className?: string;
}

const Divider = ({ className }: Props) => (
  <div className={classNames('border w-full border-zinc-200 dark:border-zinc-800', className)} />
);

export default Divider;
