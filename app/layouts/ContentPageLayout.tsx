import SharedLayout from './SharedLayout';

interface Props {
  children: React.ReactNode;
  searchBar?: boolean;
}

const ContentPageLayout = ({ children, searchBar }: Props) => {
  return (
    <SharedLayout searchBar={searchBar} padding>
      <div className="max-w-3xl mx-auto">{children}</div>
    </SharedLayout>
  );
};

export default ContentPageLayout;
