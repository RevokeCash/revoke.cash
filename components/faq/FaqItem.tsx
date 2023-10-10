import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon, HashtagIcon } from '@heroicons/react/24/outline';
import Href from 'components/common/Href';
import { useMounted } from 'lib/hooks/useMounted';
import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  question: string;
  slug: string;
  children: ReactNode;
}

const FaqItem = ({ question, slug, children }: Props) => {
  const isMounted = useMounted();

  return (
    <Disclosure
      as="div"
      className="py-4 w-full relative group"
      property="mainEntity"
      typeof="Question"
      id={slug}
      // We're using this "key" hack to force a re-mount of the component when the page loads, this allows us to
      // automatically open the FAQ item if the URL contains the question in its hash, while also having full SSR.
      key={`${slug}-${isMounted}`}
      defaultOpen={isMounted && window.location.hash === `#${slug}`}
    >
      {({ open }) => (
        <>
          <dt className="relative">
            <Disclosure.Button className="flex gap-2 w-full items-center justify-between text-left">
              <h2 className="text-lg" property="name">
                {question}
              </h2>
              <ChevronDownIcon className={twMerge(open ? '-rotate-180' : 'rotate-0', 'h-6 w-6 transform shrink-0')} />
            </Disclosure.Button>
            <div className="absolute top-0 -right-8 h-full w-8 z-10">
              <Href href={`#${slug}`} underline="none" router className="flex h-full items-center">
                {open ? (
                  <HashtagIcon className={twMerge('h-6 w-6 ml-2 shrink-0 hidden group-hover:flex')} />
                ) : (
                  // We add this disclosure button to make the link also open the FAQ item (but only when it's closed)
                  <Disclosure.Button>
                    <HashtagIcon className={twMerge('h-6 w-6 ml-2 shrink-0 hidden group-hover:flex')} />
                  </Disclosure.Button>
                )}
              </Href>
            </div>
          </dt>
          <Disclosure.Panel as="dd" className="mt-2" unmount={false} property="acceptedAnswer" typeof="Answer">
            <p property="text">{children}</p>
          </Disclosure.Panel>
          {/* Add this absolute positioned div to align the "group" position with the hash link */}
          <div className="absolute top-0 -right-8 h-full w-8" />
        </>
      )}
    </Disclosure>
  );
};

export default FaqItem;
