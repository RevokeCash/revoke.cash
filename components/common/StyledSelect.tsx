import Select, { Props } from 'react-select';

const StyledSelect = (props: Props) => {
  return (
    <Select
      {...props}
      styles={{
        menu: (styles) => ({
          ...styles,
          width: 110,
          margin: 0,
          textAlign: 'left',
          zIndex: 3,
        }),
        menuList: (styles) => ({
          ...styles,
          padding: 0,
        }),
        dropdownIndicator: (styles) => ({
          ...styles,
          padding: 2,
        }),
        valueContainer: (styles) => ({
          ...styles,
          padding: 2,
        }),
        control: (styles) => ({
          ...styles,
          minHeight: 24,
          cursor: 'pointer',
        }),
        option: (styles) => ({
          ...styles,
          cursor: 'pointer',
          padding: '8px 8px',
          '&:first-child': {
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
          },
          '&:last-child': {
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 4,
          },
        }),
      }}
      theme={(theme) => ({
        ...theme,
        borderRadius: 4,
        colors: {
          ...theme.colors,
          primary: 'black',
          primary25: '#ddd',
          neutral10: 'black',
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

export default StyledSelect;
