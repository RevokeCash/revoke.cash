import { ReactNode } from 'react';

interface Props {
  title?: string;
  children: ReactNode;
}

const LandingParagraph = ({ title, children }: Props) => {
  return (
    <div>
      {title && <h4>{title}</h4>}
      <div className="text-zinc-700 dark:text-zinc-300">{children}</div>
    </div>
  );
};

export default LandingParagraph;
