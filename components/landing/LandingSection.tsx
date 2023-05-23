import { ReactNode } from 'react';

interface Props {
  title?: string;
  size: 'h1' | 'h2';
  children: ReactNode;
}

const LandingSection = ({ title, size, children }: Props) => {
  return (
    <div className="w-full px-4">
      <div className="flex flex-col gap-4 md:gap-4 max-w-3xl mx-auto">
        {title &&
          (size === 'h1' ? (
            <h1 className="text-4xl md:text-5xl">{title}</h1>
          ) : (
            <h2 className="text-3xl md:text-4xl">{title}</h2>
          ))}
        <div className="flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
};

export default LandingSection;
