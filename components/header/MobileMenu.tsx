'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import FocusTrap from 'components/common/FocusTrap';
import WalletIndicator from 'components/header/WalletIndicator';
import { CHROME_EXTENSION_URL } from 'lib/constants';
import { usePathname } from 'lib/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Fragment, useEffect, useRef, useState } from 'react';
import NavLink from './NavLink';

const MobileMenu = () => {
  const t = useTranslations();
  const focusRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const path = usePathname();

  const [open, setOpen] = useState(false);
  const [headerBottom, setHeaderBottom] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: We want to close the menu when the path changes
  useEffect(() => {
    setOpen(false);
  }, [path]);

  // Measure the bottom of the header's content box (excluding its bottom padding)
  // so the menu is pinned right below the logo/close button, regardless of whether
  // an announcement banner is visible.
  useEffect(() => {
    if (!open) return;
    const header = containerRef.current?.closest('header');
    if (!header) return;
    const measure = () => {
      const paddingBottom = parseFloat(getComputedStyle(header).paddingBottom) || 0;
      setHeaderBottom(header.getBoundingClientRect().bottom - paddingBottom);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open]);

  return (
    <div className="flex flex-col" ref={containerRef}>
      {open ? (
        <Button style="none" size="none" onClick={() => setOpen(false)} aria-label="Close Menu">
          <XMarkIcon className="h-8 w-8" />
        </Button>
      ) : (
        <Button style="none" size="none" onClick={() => setOpen(true)} aria-label="Open Menu">
          <Bars3Icon className="h-8 w-8" />
        </Button>
      )}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" initialFocus={focusRef} onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel
              className="fixed inset-x-0 bottom-0 z-10 overflow-y-auto bg-white dark:bg-black"
              style={{ top: headerBottom }}
            >
              <div className="flex flex-col items-center gap-6 p-12">
                <FocusTrap ref={focusRef} />
                <WalletIndicator size="none" style="tertiary" className="text-lg" />
                <NavLink to={CHROME_EXTENSION_URL} text={t('common.nav.extension')} external />
                <NavLink to="/exploits" text={t('common.nav.exploits')} />
                <NavLink to="/learn" text={t('common.nav.learn')} />
                <NavLink to="/blog" text={t('common.nav.blog')} />
                <NavLink to="/merchandise" text={t('common.nav.merchandise')} />
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default MobileMenu;
