import type { ReactNode } from 'react';

interface Props {
  question: string;
  children: ReactNode;
}

const LandingPageFaqItem = ({ question, children }: Props) => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold">{question}</h3>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{children}</p>
    </div>
  );
};
export default LandingPageFaqItem;
