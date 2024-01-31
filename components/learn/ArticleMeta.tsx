import Href from 'components/common/Href';
import { ContentMeta } from 'lib/interfaces';
import { formatArticleDate } from 'lib/utils/time';
import Trans from 'next-translate/Trans';

interface Props {
  meta: ContentMeta;
}

const ArticleMeta = ({ meta }: Props) => {
  const properties = [
    !!meta.author ? 'author' : undefined,
    !!meta.translator && meta.language !== 'en' ? 'translator' : undefined,
    !!meta.date ? 'date' : undefined,
    !!meta.readingTime && !!meta.author ? 'reading_time' : undefined, // reading_time only if author is present (blog posts only)
  ].filter((property) => !!property);

  if (properties.length === 0) return null;
  if (!properties.includes('translator') && !properties.includes('author')) return null;

  return (
    <div className="flex justify-center gap-2 flex-wrap max-sm:text-sm text-center my-4 text-zinc-500 dark:text-zinc-400">
      {properties.map((property, i) => (
        <MetaProperty key={property} property={property} meta={meta} separator={i < properties.length - 1} />
      ))}
    </div>
  );
};

interface MetaPropertyProps {
  property: string;
  meta: ContentMeta;
  separator?: boolean;
}

const MetaProperty = ({ property, meta, separator }: MetaPropertyProps) => {
  if (!property) return null;

  return (
    <div key={property} className="flex gap-2">
      <MetaPropertyChild property={property} meta={meta} />
      {separator && <div>•</div>}
    </div>
  );
};

const MetaPropertyChild = ({ property, meta }: MetaPropertyProps) => {
  if (!property) return null;

  if (property === 'date') {
    return <div>{formatArticleDate(meta.date)}</div>;
  }

  if (property === 'author' || property === 'translator') {
    const component = meta[property].url ? (
      <Href href={meta[property].url} className="font-bold" underline="hover" external />
    ) : (
      <span className="font-bold" />
    );

    return (
      <div>
        <Trans
          i18nKey={`common:article_meta.${property}`}
          values={{ ...meta, [property]: meta[property].name }}
          components={[component]}
        />
      </div>
    );
  }

  return (
    <div>
      <Trans i18nKey={`common:article_meta.${property}`} values={meta} components={[<span className="font-bold" />]} />
    </div>
  );
};

export default ArticleMeta;
