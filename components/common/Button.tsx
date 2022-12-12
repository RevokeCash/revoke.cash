import { classNames } from 'lib/utils/styles';
import Spinner from './Spinner';

interface Props {
  disabled?: boolean;
  style: 'primary' | 'secondary' | 'tertiary' | 'none';
  size: 'sm' | 'md' | 'lg' | 'none';
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
  loading?: boolean;
}

const Button = ({ disabled, style, size, onClick, href, external, children, className, loading }: Props) => {
  const classMapping = {
    common: 'flex justify-center items-center border border-black focus:outline-black duration-150',
    primary: 'bg-black text-white visited:text-white hover:bg-gray-800 disabled:bg-gray-600',
    secondary: 'bg-white text-black visited:text-black hover:bg-gray-200 disabled:bg-gray-300',
    tertiary: 'text-black border-none',
    sm: 'px-2 py-0.5 text-xs rounded-md',
    md: 'px-4 py-1.5 text-base rounded-lg',
    lg: 'px-6 py-2 text-lg rounded-xl',
  };

  const classes = classNames(
    style !== 'none' && classMapping.common,
    classMapping[style],
    size !== 'none' && classMapping[size],
    loading && 'flex gap-1', // TODO: Make this more robust when needed
    className
  );

  if (href) {
    return (
      <a href={href} className={classes} target={external ? '_blank' : undefined}>
        {children}
      </a>
    );
  }

  return (
    <button disabled={disabled || loading} onClick={onClick} className={classes}>
      {children}
      {loading && <Spinner />}
    </button>
  );
};

export default Button;
