'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import FocusTrap from 'components/common/FocusTrap';
import { usePathname } from 'lib/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Fragment, memo, useEffect, useRef, useState } from 'react';
import NavLink from './NavLink';

// Memoize NavLink
const MemoizedNavLink = memo(NavLink);

const MobileMenu = () => {
  const t = useTranslations();
  const focusRef = useRef(null);
  const path = usePathname();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  return (
    <div className="flex flex-col">
      {open ? (
        <Button style="none" size="none" onClick={() => setOpen(false)} aria-label="Close Menu">
          <XMarkIcon className="h-8 w-8" />
        </Button>
      ) : (
        <Button style="none" size="none" onClick={() => setOpen(true)} aria-label="Open Menu">
          <Bars3Icon className="h-8 w-8" />
        </Button>
      )}

      {/* Conditional Rendering: Only render Transition.Root and Dialog when the menu is open */}
      {open && (
        <Transition.Root show={open} as={Fragment}>
          <Dialog as="div" className="absolute inset-0" initialFocus={focusRef} onClose={setOpen}>
            <Transition.Child
              as={Fragment}
              enter="transition-transform duration-200 ease-out"
              enterFrom="opacity-0 transform translate-y-4"
              enterTo="opacity-100 transform translate-y-0"
              leave="transition-transform duration-150 ease-in"
              leaveFrom="opacity-100 transform translate-y-0"
              leaveTo="opacity-0 transform translate-y-4"
            >
              <Dialog.Panel className="absolute inset-0 top-[4.5rem] z-10 overflow-y-auto bg-white dark:bg-black w-screen h-screen">
                <div className="flex flex-col items-center gap-6 p-12">
                  <FocusTrap ref={focusRef} />
                  <MemoizedNavLink to="/extension" text={t('common.nav.extension')} />
                  <MemoizedNavLink to="/exploits" text={t('common.nav.exploits')} />
                  <MemoizedNavLink to="/learn" text={t('common.nav.learn')} />
                  <MemoizedNavLink to="/learn/faq" text={t('common.nav.faq')} />
                  <MemoizedNavLink to="/blog" text={t('common.nav.blog')} />
                  <MemoizedNavLink to="/about" text={t('common.nav.about')} />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </Dialog>
        </Transition.Root>
      )}
      {/* End of Conditional Rendering */}
    </div>
  );
};

export default MobileMenu;
