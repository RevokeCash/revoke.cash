import Card from 'components/common/Card';
import Href from 'components/common/Href';
import { ISidebarEntry } from 'lib/interfaces';

const ArticleCardSection = ({ title, children }: Omit<ISidebarEntry, 'title' | 'path'> & Partial<ISidebarEntry>) => {
  if (!children?.length) return null;

  return (
    <div className="mb-8 last:mb-0">
      {title ? <h2>{title}</h2> : null}
      <div className="grid md:grid-cols-2 gap-4 items-stretch justify-center not-prose">
        {children.map((child) => (
          <ArticleCard key={child.title} {...child} />
        ))}
      </div>
    </div>
  );
};

const ArticleCard = ({ title, description, path }: ISidebarEntry) => (
  <Href href={path} router underline="none" className="h-full">
    <Card title={title} className="h-full">
      <p>{description}</p>
    </Card>
  </Href>
);

export default ArticleCardSection;
