import { components, OptionProps } from 'react-select';

// Make sure that the selected option is not highlighted
const Option = (props: OptionProps) => {
  return components.Option({ ...props, isSelected: false });
};

export default Option;
