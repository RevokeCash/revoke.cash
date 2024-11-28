import Href from 'components/common/Href';
import type { ContentMeta } from 'lib/interfaces';
import { isNullish } from 'lib/utils';
import { formatArticleDate } from 'lib/utils/time';
import { useTranslations } from 'next-intl';

interface Props {
  meta: ContentMeta;
}

const ArticleMeta = ({ meta }: Props) => {
  const properties = [
    !isNullish(meta.author) ? 'author' : undefined,
    !isNullish(meta.translator) && meta.language !== 'en' ? 'translator' : undefined,
    !isNullish(meta.date) ? 'date' : undefined,
    !isNullish(meta.readingTime) && !isNullish(meta.author) ? 'reading_time' : undefined, // reading_time only if author is present (blog posts only)
  ].filter((property) => !isNullish(property));

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
  const t = useTranslations();

  if (!property) return null;

  if (property === 'date' && meta.date) {
    return <div>{formatArticleDate(meta.date)}</div>;
  }

  if (property === 'author' || property === 'translator') {
    const personLink = (children: React.ReactNode) =>
      meta[property]?.url ? (
        <Href href={meta[property].url} className="font-bold" underline="hover" external>
          {children}
        </Href>
      ) : (
        <span className="font-bold">{children}</span>
      );

    return (
      <div>
        {t.rich(`common.article_meta.${property}`, {
          [property]: meta[property]?.name,
          'person-link': personLink,
        })}
      </div>
    );
  }

  return <div>{t.rich(`common.article_meta.${property}`, { ...(meta as any) })}</div>;
};

export default ArticleMeta;
