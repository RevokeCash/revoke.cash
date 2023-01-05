interface Props {
  size: number;
}

const PlaceholderIcon = ({ size }: Props) => {
  return (
    <div style={{ width: size, height: size }} className="bg-gray-300 dark:bg-gray-600 aspect-square rounded-full" />
  );
};

export default PlaceholderIcon;
