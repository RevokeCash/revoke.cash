import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { classNames } from 'lib/utils/classNames';
import { Fragment, useState } from 'react';

type BaseItem = {
  img: string;
  text: string;
};

interface Props<T> {
  items: Array<BaseItem & T>;
}

/**
 * Generic select dropdown
 */
const SelectDropdown = <T extends {}>({ items }: Props<T>) => {
  const [selected, setSelected] = useState(items[0]);
  return (
    <Listbox value={selected} onChange={setSelected}>
      {({ open }) => (
        <>
          <div className="relative text-xs">
            <Listbox.Button className="border border-black relative min-w-full cursor-default rounded-md rounded-r-none   bg-white py-2 pl-3 pr-8 text-left focus:outline-none focus:ring-1 ">
              <span className="flex items-center">
                <img src={selected.img} alt="" className="h-6 w-6 flex-shrink-0 rounded-full" />
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-56 min-w-full overflow-y-auto rounded-md bg-white py-1 shadow-lg ring-1  ring-black ring-opacity-5 focus:outline-none">
                {items.map((item, idx) => (
                  <Listbox.Option
                    key={idx}
                    className={({ active }) =>
                      classNames(
                        active ? 'text-white bg-indigo-600' : 'text-gray-900',
                        'relative cursor-default select-none py-2 pl-3 pr-9 w-60'
                      )
                    }
                    value={item}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center">
                          <img src={item.img} alt="" className="h-6 w-6 flex-shrink-0 rounded-full" />
                          <span
                            className={classNames(selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate')}
                          >
                            {item.text}
                          </span>
                        </div>

                        {selected ? (
                          <span
                            className={classNames(
                              active ? 'text-white' : 'text-indigo-600',
                              'absolute inset-y-0 right-0 flex items-center pr-4'
                            )}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
};

export default SelectDropdown;
