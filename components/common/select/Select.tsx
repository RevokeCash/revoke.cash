import { classNames } from 'lib/utils/styles';
import ReactSelect, { components, OptionProps, Props as ReactSelectProps } from 'react-select';

interface Props extends ReactSelectProps {
  minMenuWidth?: number;
  size?: 'sm' | 'md';
}

// This component is created to allow us to customise the styles of the react-select component
// the className prop can still be used to customise some of the styles per component
const Select = (props: Props) => {
  // vertical padding is technically added by the height of the control
  const controlPadding = {
    sm: '0px 4px', // px-1
    md: '0px 8px', // px-2
  };

  const controlHeight = {
    sm: 24, // h-6
    md: 36, // h-9
  };

  return (
    <ReactSelect
      {...props}
      className={classNames(props.className)}
      components={{ IndicatorSeparator: null, Option, ...props.components }}
      styles={{
        control: (styles) => ({
          ...styles,
          display: 'flex', // flex
          boxSizing: 'border-box', // border-box
          alignItems: 'center', // align-center
          '&:hover': {
            backgroundColor: '#f3f4f6', // hover:bg-gray-100
          },
          cursor: 'pointer', // cursor-pointer
          height: controlHeight[props.size || 'md'],
          minHeight: controlHeight[props.size || 'md'],
          padding: controlPadding[props.size || 'md'],
        }),
        menu: (styles) => ({
          ...styles,
          textAlign: 'left', // text-left
          border: '1px solid black', // border border-black
          overflow: 'hidden', // overflow-hidden
          minWidth: props.minMenuWidth,
        }),
        groupHeading: (styles) => ({
          ...styles,
          paddingTop: 12, // pt-3
        }),
        group: removeSpacing,
        menuList: removeSpacing,
        dropdownIndicator: removeSpacing,
        clearIndicator: removeSpacing,
        valueContainer: removeSpacing,
        indicatorsContainer: removeSpacing,
        singleValue: removeSpacing,
        option: (styles) => ({
          ...styles,
          cursor: 'pointer', // cursor-pointer
          padding: '8px 8px', // p-2
        }),
      }}
      theme={(theme) => ({
        ...theme,
        borderRadius: 8, // rounded-lg
        colors: {
          ...theme.colors,
          primary: 'black',
          primary25: '#f3f4f6', // gray-100
          neutral10: '#6b7280', // gray-500
          neutral20: 'black',
          neutral30: 'black',
          neutral40: 'black',
          neutral50: 'black',
          neutral60: 'black',
          neutral70: 'black',
          neutral80: 'black',
          neutral90: 'black',
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
