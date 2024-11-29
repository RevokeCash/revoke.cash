'use client';

import { useColorTheme } from 'lib/hooks/useColorTheme';
import { Ref } from 'react';
import ReactSelect, { GroupBase, Props as ReactSelectProps, SelectInstance } from 'react-select';
import { twMerge } from 'tailwind-merge';

export interface Props<O, I extends boolean, G extends GroupBase<O>> extends ReactSelectProps<O, I, G> {
  minMenuWidth?: number | string;
  minControlWidth?: number | string;
  menuAlign?: 'left' | 'right';
  size?: 'sm' | 'md' | 'full';
  controlTheme?: 'light' | 'dark';
  menuTheme?: 'light' | 'dark';
  keepMounted?: boolean;
  selectRef?: Ref<SelectInstance<O, I, G>>;
}

// This component is created to allow us to customise the styles of the react-select component
// the className prop can still be used to customise some of the styles per component
const Select = <O, I extends boolean, G extends GroupBase<O>>(props: Props<O, I, G>) => {
  const { darkMode } = useColorTheme();

  const controlTheme = props.controlTheme ?? (darkMode ? 'dark' : 'light');
  const menuTheme = props.menuTheme ?? (darkMode ? 'dark' : 'light');

  const controlClassMapping = {
    sm: 'h-6 px-1',
    md: 'h-9 px-2',
    full: 'h-full px-2',
  };

  // TODO: Manage colors through tailwind / className integration -> move to unstyled react-select
  const colors = {
    primary: 'black', // black
    secondary: 'white', // white
    lightest: '#e4e4e7', // zinc-200
    light: '#d4d4d8', // zinc-300
    dark: '#71717a', // zinc-500
    darkest: '#27272a', // zinc-800
    brand: '#fdb952',
  };

  return (
    <ReactSelect
      {...props}
      ref={props.selectRef}
      className={twMerge(props.className)}
      components={{
        IndicatorSeparator: null,
        ClearIndicator: () => null,
        ...props.components,
      }}
      classNames={{
        control: (state) =>
          twMerge(
            // Attempt to match the browser's focus-visible behaviour for <select> elements
            // (only display the focus ring when the element is focused via the keyboard)
            state.isFocused && '[&:has(:focus-visible)]:ring-1 [&:has(:focus-visible)]:ring-current',
            state.menuIsOpen && '[&:has(:focus-visible)]:ring-0',
            'flex items-center box-border ',
            controlClassMapping[props.size || 'md'],
          ),
      }}
      styles={{
        control: (styles) => ({
          ...styles,
          color: controlTheme === 'dark' ? colors.secondary : colors.primary,
          backgroundColor: controlTheme === 'dark' ? colors.primary : colors.secondary,
          '&:hover': {
            backgroundColor: controlTheme === 'dark' ? colors.darkest : colors.lightest,
          },
          minHeight: 0,
          minWidth: props.minControlWidth,
          cursor: 'pointer',
        }),
        menu: (styles) => ({
          ...styles,
          textAlign: 'left', // text-left
          border: '1px solid', // border
          color: menuTheme === 'dark' ? colors.secondary : colors.primary,
          backgroundColor: menuTheme === 'dark' ? colors.primary : colors.secondary,
          borderColor: menuTheme === 'dark' ? colors.secondary : colors.primary,
          overflow: 'hidden', // overflow-hidden
          minWidth: props.minMenuWidth,
          position: 'absolute',
          right: props.menuAlign === 'right' ? undefined : 0,
          // height: 400,
        }),
        groupHeading: (styles) => ({
          ...styles,
          paddingTop: '0.75rem', // pt-3
        }),
        placeholder: removeSpacing,
        group: removeSpacing,
        menuList: (styles) => ({
          ...removeSpacing(styles),
          maxHeight: '22rem',
        }),
        dropdownIndicator: removeSpacing,
        clearIndicator: removeSpacing,
        valueContainer: removeSpacing,
        indicatorsContainer: removeSpacing,
        singleValue: removeSpacing,
        option: (styles, optionProps) => ({
          ...styles,
          cursor: optionProps.isDisabled ? 'not-allowed' : 'pointer',
          padding: '0.5rem', // p-2
          backgroundColor: (() => {
            if (optionProps.isDisabled) {
              return menuTheme === 'light' ? colors.light : colors.dark;
            }
            if (optionProps.isSelected) {
              return menuTheme === 'light' ? colors.light : colors.dark;
            }
            if (optionProps.isFocused) {
              return menuTheme === 'light' ? colors.lightest : colors.darkest;
            }
            return styles.backgroundColor;
          })(),
          borderLeft: optionProps.isSelected ? `4px solid ${colors.brand}` : undefined,
        }),
      }}
      theme={(theme) => ({
        ...theme,
        borderRadius: 8, // rounded-lg
        colors: {
          ...theme.colors,
          primary: controlTheme === 'dark' ? colors.secondary : colors.primary, // focus color
          primary25: menuTheme === 'dark' ? colors.darkest : colors.lightest, // option hover color
          primary50: menuTheme === 'dark' ? colors.dark : colors.light, // option click color
          // primary75: 'red', // ??
          // neutral0: 'red', // control + menu background color (handled separately above)
          // neutral5: 'red', // ??
          // neutral10: 'red', // ??
          neutral20: controlTheme === 'dark' ? colors.secondary : colors.primary, // control border + indicator color
          // neutral30: 'red', // ??
          neutral40: controlTheme === 'dark' ? colors.secondary : colors.primary, // indicator hover color
          // neutral50: 'red', // ??
          neutral60: controlTheme === 'dark' ? colors.secondary : colors.primary, // indicator focus color
          // neutral70: 'red', // ??
          neutral80: controlTheme === 'dark' ? colors.secondary : colors.primary, // control text color
          // neutral90: 'red', // ??
        },
      })}
    />
  );
};

export default Select;

const removeSpacing = (styles: any) => ({
  ...styles,
  padding: 0,
  margin: 0,
});
