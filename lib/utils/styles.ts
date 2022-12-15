/**
 * Function that allows you to use logic within the classNames property of a ReactNode while keeping the code readable.
 * @example classNames={classNames(isDarkmode ? : text-white : text-black)}
 * @param classes
 * @returns Concatination of classNames
 */
export const classNames = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ');
};
