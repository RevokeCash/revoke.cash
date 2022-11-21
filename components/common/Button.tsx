import { classNames } from 'lib/utils/classNames';

interface Props {
  disabled?: boolean;
  style: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}

export const Button = ({ disabled, style, size, onClick, href, external, children, className }: Props) => {
  const commonClasses = 'flex justify-center items-center border border-black rounded focus:outline-none duration-150';
  const primaryClasses = 'bg-black text-white visited:text-white hover:bg-gray-800';
  const secondaryClasses = 'bg-white text-black visited:text-black hover:bg-gray-200';
  const smallClasses = 'px-1.5 py-0.5 text-xs';
  const mediumClasses = 'px-3 py-1.5 text-base';
  const largeClasses = 'px-4 py-2 text-lg';

  const classes = classNames(
    commonClasses,
    style === 'primary' ? primaryClasses : style === 'secondary' ? secondaryClasses : undefined,
    size === 'sm' ? smallClasses : size === 'md' ? mediumClasses : size === 'lg' ? largeClasses : undefined,
    className
  );

  if (href) {
    return (
      <a href={href} className={classes} target={external ? '_blank' : ''}>
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
