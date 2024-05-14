import SearchBar from './SearchBar';

interface Props {
  render?: boolean;
}

const HeaderAttachedSearchBar = ({ render = true }: Props) => {
  if (!render) return null;

  // We add a negative margin so the SearchBar is grouped with the header
  return (
    <div className="flex justify-center -mt-4 mb-8 px-4 lg:px-8">
      <SearchBar />
    </div>
  );
};

export default HeaderAttachedSearchBar;
