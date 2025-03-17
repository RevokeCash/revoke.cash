import { twMerge } from 'tailwind-merge';

interface Props {
  children: React.ReactNode;
  title?: string;
  columns?: number;
  className?: string;
}

const GridList = ({ title, children, columns = 1, className }: Props) => (
  <div className="flex flex-col gap-2">
    {title && <h4 className="text-lg font-semibold">{title}</h4>}
    <ul className={twMerge(`grid grid-cols-${columns} gap-2`, className)}>{children}</ul>
  </div>
);

export default GridList;
