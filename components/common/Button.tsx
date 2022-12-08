import { classNames } from 'lib/utils/styles';

interface Props {
  disabled?: boolean;
  style: 'primary' | 'secondary' | 'tertiary' | 'none';
  size: 'sm' | 'md' | 'lg' | 'none';
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}

const Button = ({ disabled, style, size, onClick, href, external, children, className }: Props) => {
  const classMapping = {
    common: 'flex justify-center items-center border border-black rounded focus:outline-black duration-150',
    primary: 'bg-black text-white visited:text-white hover:bg-gray-800 disabled:bg-gray-600',
    secondary: 'bg-white text-black visited:text-black hover:bg-gray-200 disabled:bg-gray-300',
    tertiary: 'text-black border-none',
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-3 py-1.5 text-base',
    lg: 'px-4 py-2 text-lg',
  };

  const classes = classNames(
    style !== 'none' && classMapping.common,
    classMapping[style],
    size !== 'none' && classMapping[size],
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
    <button disabled={disabled} onClick={onClick} className={classes}>
      {children}
    </button>
  );
};

export default Button;
