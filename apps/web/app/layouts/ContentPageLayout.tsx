import SharedLayout from './SharedLayout';

interface Props {
  children: React.ReactNode;
  hero?: React.ReactNode;
  searchBar?: boolean;
}

const ContentPageLayout = ({ children, hero, searchBar }: Props) => {
  return (
    <SharedLayout searchBar={searchBar} padding>
      {hero}
      <div className="max-w-3xl mx-auto">{children}</div>
    </SharedLayout>
  );
};

export default ContentPageLayout;
