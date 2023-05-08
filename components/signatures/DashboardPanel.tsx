import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
}

const DashboardPanel = ({ title, subtitle, children, className }: Props) => {
  return (
    <div className="w-full border border-black dark:border-white rounded-lg">
      {(title || subtitle) && (
        <div className="w-full border-b border-black dark:border-white py-2 px-4">
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      )}
      <div className={twMerge('w-full py-2 px-4', className)}>{children}</div>
    </div>
  );
};

export default DashboardPanel;
