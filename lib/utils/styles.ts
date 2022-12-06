/**
 * Function that allows you to use logic within the classNames property of a ReactNode while keeping the code readable.
 * @example classNames={classNames(isDarkmode ? : text-white : text-black)}
 * @param classes
 * @returns Concatination of classNames
 */
export const classNames = (...classes: string[]) => {
  return classes.filter(Boolean).join(' ');
};

export const setSelectThemeColors = (theme: any) => ({
  ...theme,
  borderRadius: 4,
  colors: {
    ...theme.colors,
    primary: 'black',
    primary25: 'rgb(229 231 235)',
    neutral10: '#6b7280',
    neutral20: 'black',
    neutral30: 'black',
    neutral40: 'black',
    neutral50: 'black',
    neutral60: 'black',
    neutral70: 'black',
    neutral80: 'black',
    neutral90: 'black',
  },
});
