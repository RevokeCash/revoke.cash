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
  ].filter((property) => !!property);

  if (properties.length === 0) return null;

  return (
    <div className="flex justify-center gap-2 flex-wrap max-sm:text-sm text-center">
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
