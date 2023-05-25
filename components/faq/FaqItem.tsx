import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  question: string;
  children: ReactNode;
}

const FaqItem = ({ question, children }: Props) => {
  return (
    <Disclosure as="div" className="py-4 w-full">
      {({ open }) => (
        <>
          <dt className="text-lg">
            <Disclosure.Button className="flex gap-2 w-full items-center justify-between text-left">
              <h2 className="text-lg">{question}</h2>
              <ChevronDownIcon className={twMerge(open ? '-rotate-180' : 'rotate-0', 'h-6 w-6 transform shrink-0')} />
            </Disclosure.Button>
          </dt>
          <Disclosure.Panel as="dd" className="mt-2 text-base text-zinc-700 dark:text-zinc-300">
            {children}
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};
export default FaqItem;
