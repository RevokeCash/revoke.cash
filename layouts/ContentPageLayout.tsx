import PublicLayout from './PublicLayout';

interface Props {
  children: React.ReactNode;
}

const ContentPageLayout = ({ children }: Props) => {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto">{children}</div>
    </PublicLayout>
  );
};

export default ContentPageLayout;
