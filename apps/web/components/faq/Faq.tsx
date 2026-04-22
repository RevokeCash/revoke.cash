import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const Faq = ({ children }: Props) => {
  return (
    <dl
      className="w-full divide-y divide-zinc-200 dark:divide-zinc-800 pr-6 lg:pr-4"
      vocab="https://schema.org/"
      typeof="FAQPage"
    >
      {children}
    </dl>
  );
};

export default Faq;
