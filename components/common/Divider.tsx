import { classNames } from 'lib/utils/styles';

interface Props {
  className?: string;
}

const Divider = ({ className }: Props) => <div className={classNames('border w-full', className)} />;

export default Divider;
