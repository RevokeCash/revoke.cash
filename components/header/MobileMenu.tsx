import { Dialog, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import WalletIndicator from 'components/header/WalletIndicator';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useRef, useState } from 'react';
import DonateButton from '../common/DonateButton';
import NavLink from './NavLink';

const MobileMenu = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const focusRef = useRef(null);

  const [open, setOpen] = useState(false);
  const toggleOpen = () => setOpen(!open);

  // Close menu on navigation
  useEffect(() => {
    setOpen(false);
  }, [router.asPath]);

  return (
    <div className="flex flex-col">
      <Button style="none" size="none" onClick={toggleOpen} aria-label="Toggle Menu">
        {!open && <Bars3Icon className="h-8 w-8" />}
        {open && <XMarkIcon className="h-8 w-8" />}
      </Button>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="absolute inset-0 top-[4.5rem]" initialFocus={focusRef} onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel className="z-10 overflow-y-auto bg-white dark:bg-black w-screen h-screen">
              <div className="flex flex-col items-center gap-6 p-12">
                <button ref={focusRef} /> {/* Focus trap */}
                <WalletIndicator menuAlign="right" size="none" style="tertiary" className="text-lg" />
                <DonateButton size="none" style="tertiary" className="text-lg" />
                <NavLink to="/extension" text={t('common:nav.extension')} />
                <NavLink to="/exploits" text={t('common:nav.exploits')} />
                <NavLink to="/learn" text={t('common:nav.learn')} />
                <NavLink to="/learn/faq" text={t('common:nav.faq')} />
                <NavLink to="/about" text={t('common:nav.about')} />
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default MobileMenu;
