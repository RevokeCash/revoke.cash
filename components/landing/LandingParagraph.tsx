import { ReactNode } from 'react';

interface Props {
  title?: string;
  children: ReactNode;
  className?: string;
}

const LandingParagraph = ({ title, children, className }: Props) => {
  return (
    <div>
      {title && <h3 className="text-xl">{title}</h3>}
      <p className={className}>{children}</p>
    </div>
  );
};

export default LandingParagraph;
