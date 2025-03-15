interface Props {
  children: React.ReactNode;
}

const ListItem = ({ children }: Props) => (
  <li className="pl-4 relative">
    <div className="absolute left-0 top-[0.4em] w-2 h-2 rounded-full bg-brand inline-flex mr-2" />
    {children}
  </li>
);

export default ListItem;
