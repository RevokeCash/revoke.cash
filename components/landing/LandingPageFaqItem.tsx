import { ReactNode } from 'react';

interface Props {
  question: string;
  children: ReactNode;
}

const LandingPageFaqItem = ({ question, children }: Props) => {
  return (
    <div className="flex flex-col gap-1">
      <dt>
        <h3 className="text-xl">{question}</h3>
      </dt>
      <dd>
        <p>{children}</p>
      </dd>
    </div>
  );
};
export default LandingPageFaqItem;
