'use client';

import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import type { ISidebarEntry } from 'lib/interfaces';
import { useTranslations } from 'next-intl';
import StickyBox from 'react-sticky-box';
import { twMerge } from 'tailwind-merge';
import SidebarEntry from './SidebarEntry';

interface Props {
  entries: ISidebarEntry[];
}

const Sidebar = ({ entries }: Props) => {
  const t = useTranslations();

  const sidebarContent = (
    <ul className="flex flex-col gap-1 text-zinc-600 dark:text-zinc-400">
      {entries.map((entry) => (
        <SidebarEntry key={entry.path} {...entry} />
      ))}
    </ul>
  );

  return (
    <aside>
      <StickyBox offsetTop={16} offsetBottom={16}>
        <Disclosure
          as="div"
          className="w-full border border-black dark:border-white rounded-lg bg-white dark:bg-black lg:w-80 px-4 py-2"
        >
          {({ open }) => {
            return (
              <>
                <Disclosure.Button className="flex gap-2 w-full items-center justify-between text-left lg:hidden">
                  <div className={twMerge('font-bold', open && 'invisible')}>{t('learn.sidebar.mobile_header')}</div>
                  <ChevronDownIcon
                    className={twMerge(open ? '-rotate-180' : 'rotate-0', 'h-6 w-6 transform shrink-0')}
                  />
                </Disclosure.Button>
                <Disclosure.Panel className="lg:hidden">{sidebarContent}</Disclosure.Panel>
                <Disclosure.Panel className="hidden lg:flex" static>
                  {sidebarContent}
                </Disclosure.Panel>
              </>
            );
          }}
        </Disclosure>
      </StickyBox>
    </aside>
  );
};

export default Sidebar;
