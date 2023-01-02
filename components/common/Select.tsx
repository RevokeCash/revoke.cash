import { classNames } from 'lib/utils/styles';
import ReactSelect, { components, OptionProps, Props as ReactSelectProps } from 'react-select';

interface Props extends ReactSelectProps {
  minMenuWidth?: number | string;
  menuAlign?: 'left' | 'right';
  size?: 'sm' | 'md';
  controlTheme?: 'light' | 'dark';
  menuTheme?: 'light' | 'dark';
}

// This component is created to allow us to customise the styles of the react-select component
// the className prop can still be used to customise some of the styles per component
const Select = (props: Props) => {
  const controlClassMapping = {
    sm: 'h-6 px-1',
    md: 'h-9 px-2',
  };

  // TODO: Manage colors through tailwind / className integration -> move to unstyled react-select
  const colors = {
    primary: 'black', // black
    secondary: 'white', // white
    lightest: '#f3f4f6', // gray-100
    light: '#d4d4d8', // gray-300
    dark: '#6b7280', // gray-500
    darkest: '#1f2937', // gray-800
  };

  return (
    <ReactSelect
      {...props}
      className={classNames(props.className)}
      components={{ IndicatorSeparator: null, ClearIndicator: null, Option, ...props.components }}
      classNames={{
        control: (state) =>
          classNames(
            // Attempt to match the browser's focus-visible behaviour for <select> elements
            // (only display the focus ring when the element is focused via the keyboard)
            state.isFocused && '[&:has(:focus-visible)]:ring-1 [&:has(:focus-visible)]:ring-current',
            state.menuIsOpen && '[&:has(:focus-visible)]:ring-0',
            'flex items-center box-border',
            controlClassMapping[props.size || 'md']
          ),
      }}
      styles={{
        control: (styles) => ({
          ...styles,
          color: props.controlTheme === 'dark' ? colors.secondary : colors.primary,
          backgroundColor: props.controlTheme === 'dark' ? colors.primary : colors.secondary,
          '&:hover': {
            backgroundColor: props.controlTheme === 'dark' ? colors.darkest : colors.lightest,
          },
          minHeight: 0,
          cursor: 'pointer',
        }),
        menu: (styles) => ({
          ...styles,
          textAlign: 'left', // text-left
          border: '1px solid', // border
          color: props.menuTheme === 'dark' ? colors.secondary : colors.primary,
          backgroundColor: props.menuTheme === 'dark' ? colors.primary : colors.secondary,
          borderColor: props.menuTheme === 'dark' ? colors.secondary : colors.primary,
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
        option: (styles) => ({
          ...styles,
          cursor: 'pointer', // cursor-pointer
          padding: '0.5rem', // p-2
        }),
      }}
      theme={(theme) => ({
        ...theme,
        borderRadius: 8, // rounded-lg
        colors: {
          ...theme.colors,
          primary: props.controlTheme === 'dark' ? colors.secondary : colors.primary, // focus color
          primary25: props.menuTheme === 'dark' ? colors.darkest : colors.lightest, // option hover color
          primary50: props.menuTheme === 'dark' ? colors.dark : colors.light, // option click color
          // primary75: 'red', // ??
          // neutral0: 'red', // control + menu background color (handled separately above)
          // neutral5: 'red', // ??
          // neutral10: 'red', // ??
          neutral20: props.controlTheme === 'dark' ? colors.secondary : colors.primary, // control border + indicator color
          // neutral30: 'red', // ??
          neutral40: props.controlTheme === 'dark' ? colors.secondary : colors.primary, // indicator hover color
          // neutral50: 'red', // ??
          neutral60: props.controlTheme === 'dark' ? colors.secondary : colors.primary, // indicator focus color
          // neutral70: 'red', // ??
          neutral80: props.controlTheme === 'dark' ? colors.secondary : colors.primary, // control text color
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

// Make sure that the selected option is not highlighted
const Option = (props: OptionProps) => {
  return components.Option({ ...props, isSelected: false });
};
