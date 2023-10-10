import Prose from 'components/common/Prose';
import PublicLayout from './PublicLayout';

interface Props {
  children: React.ReactNode;
  searchBar?: boolean;
}

const ProseLayout = ({ children, searchBar }: Props) => {
  return (
    <PublicLayout searchBar={searchBar}>
      <Prose className="max-w-3xl mx-auto">{children}</Prose>
    </PublicLayout>
  );
};

export default ProseLayout;
