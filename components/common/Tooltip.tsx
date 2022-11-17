interface Props {
  text: string;
}

const Tooltip = ({ text }: Props) => {
  return (
    <span className="absolute h-10 hidden group-hover:flex -left-5 -top-2 -translate-y-full w-48 px-2 py-1 bg-gray-700 rounded-lg text-center text-white text-sm after:content-[''] after:absolute after:left-1/2 after:top-[100%] after:-translate-x-1/2 after:border-8 after:border-x-transparent after:border-b-transparent after:border-t-gray-700">
      {text}
    </span>
  );
};

export default Tooltip;
