interface Props {
  size: number;
}

const PlaceholderIcon = ({ size }: Props) => {
  return (
    <div style={{ width: size, height: size }} className="bg-zinc-300 dark:bg-zinc-600 aspect-square rounded-full" />
  );
};

export default PlaceholderIcon;
