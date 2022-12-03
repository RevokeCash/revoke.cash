import { classNames } from 'lib/utils/styles';
import { ClipLoader } from 'react-spinners';

interface Props {
  color?: string;
  size: number;
  center?: boolean;
}

const SpinLoader = ({ color, size, center }: Props) => {
  return (
    <div className={classNames(center && 'flex justify-center', 'loader')}>
      <ClipLoader size={size} color={color ?? '#000'} loading={true} />
    </div>
  );
};

export default SpinLoader;
