import { ReactNode } from 'react';

interface Props {
  title?: string;
  children: ReactNode;
}

const FullWidthLandingSection = ({ title, children }: Props) => {
  return (
    <div className="flex flex-col items-center gap-8 w-full p-8 pb-16 bg-black dark:bg-gray-800 text-gray-100">
      <h2 className="text-3xl md:text-4xl text-center">{title}</h2>
      <div className="flex flex-col md:flex-row gap-4">{children}</div>
    </div>
  );
};

export default FullWidthLandingSection;
