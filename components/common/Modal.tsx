import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { Fragment, ReactNode, useRef } from 'react';
import Button from './Button';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  children: ReactNode;
}

const Modal = ({ open, setOpen, children }: Props) => {
  const focusRef = useRef(null);

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" initialFocus={focusRef} onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-zinc-500 dark:bg-zinc-800 bg-opacity-75 dark:bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center py-32 px-4 text-center sm:items-start">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="border border-black dark:border-white relative transform overflow-hidden rounded-lg bg-white dark:bg-black p-4 text-left shadow-xl transition-all w-full sm:max-w-md">
                <div className="absolute top-0 right-0 pt-4 pr-4 hidden sm:block">
                  <button ref={focusRef} aria-label="Focus Trap" />
                  <Button
                    style="none"
                    size="none"
                    className="text-zinc-400 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-500"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </Button>
                </div>
                <div>{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default Modal;
