import HeaderAttachedSearchBar from 'components/header/HeaderAttachedSearchBar';

interface Props {
  children: React.ReactNode;
  searchBar?: boolean;
  padding?: boolean;
}

// Not all pages should have the search bar attached to the header, so we extract it from the "nested" layout file
const SharedLayout = ({ children, searchBar, padding }: Props) => {
  return (
    <>
      <HeaderAttachedSearchBar render={searchBar} />
      <div className={padding ? 'px-4 lg:px-8' : ''}>{children}</div>
    </>
  );
};

export default SharedLayout;
