import Prose from 'components/common/Prose';
import ContentPageLayout from './ContentPageLayout';

interface Props {
  children: React.ReactNode;
  searchBar?: boolean;
}

const ProseLayout = ({ children, searchBar }: Props) => {
  return (
    <ContentPageLayout searchBar={searchBar}>
      <Prose>{children}</Prose>
    </ContentPageLayout>
  );
};

export default ProseLayout;
