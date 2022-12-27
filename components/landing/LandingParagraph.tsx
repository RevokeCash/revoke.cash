import { ReactNode } from 'react';

interface Props {
  title?: string;
  children: ReactNode;
}

const LandingParagraph = ({ title, children }: Props) => {
  return (
    <div>
      {title && <h3>{title}</h3>}
      <div className="text-lg leading-tight text-gray-700">{children}</div>
    </div>
  );
};

export default LandingParagraph;
