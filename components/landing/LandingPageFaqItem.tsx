import { ReactNode } from 'react';

interface Props {
  question: string;
  children: ReactNode;
}

const LandingPageFaqItem = ({ question, children }: Props) => {
  return (
    <div className="flex flex-col gap-1">
      <dt>
        <h3 className="text-xl leading-6">{question}</h3>
      </dt>
      <dd className="md:text-base text-zinc-700 dark:text-zinc-300">{children}</dd>
    </div>
  );
};
export default LandingPageFaqItem;
