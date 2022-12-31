import { classNames } from 'lib/utils/styles';

interface Props {
  className?: string;
}

const Divider = ({ className }: Props) => (
  <div className={classNames('border w-full border-gray-200 dark:border-gray-800', className)} />
);

export default Divider;
