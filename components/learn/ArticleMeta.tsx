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
    !!meta.readingTime ? 'reading_time' : undefined,
  ].filter((property) => !!property);

  const structuredData = (
    <div vocab="https://schema.org/" typeof="Article">
      <meta property="headline" content={meta.title} />
      {meta.author && (
        <div property="author" typeof="Person">
          <meta property="name" content={meta.author} />
        </div>
      )}
      <meta property="datePublished" content={meta.date} />
      {meta.coverImage && <meta property="image" content={`https://revoke.cash${meta.coverImage}`} />}
    </div>
  );

  if (properties.length === 0 || !properties.includes('author')) return structuredData;

  return (
    <>
      {structuredData}
      <div className="flex justify-center gap-2 flex-wrap max-sm:text-sm text-center my-4 text-zinc-500 dark:text-zinc-400">
        {properties.map((property, i) => (
          <MetaProperty key={property} property={property} meta={meta} separator={i < properties.length - 1} />
        ))}
      </div>
    </>
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
      {property === 'date' ? (
        <div>{formatArticleDate(meta.date)}</div>
      ) : (
        <div>
          <Trans
            i18nKey={`common:article_meta.${property}`}
            values={meta}
            components={[<span className="font-bold" />]}
          />
        </div>
      )}
      {separator && <div>•</div>}
    </div>
  );
};

export default ArticleMeta;
