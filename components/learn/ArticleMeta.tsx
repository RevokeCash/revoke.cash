import Divider from 'components/common/Divider';
import { ContentMeta } from 'lib/interfaces';
import Trans from 'next-translate/Trans';

interface Props {
  meta: Pick<ContentMeta, 'author' | 'translator' | 'language'>;
}

const ArticleMeta = ({ meta }: Props) => {
  const shouldDisplayAuthor = !!meta.author;
  const shouldDisplayTranslator = !!meta.translator && meta.language !== 'en';

  if (!shouldDisplayAuthor && !shouldDisplayTranslator) return null;

  return (
    <>
      <Divider className="my-6" />
      <div className="w-full flex justify-end gap-2">
        {shouldDisplayAuthor && (
          <div>
            <Trans i18nKey="learn:article_meta.author" values={meta} components={[<span className="font-bold" />]} />
          </div>
        )}
        {shouldDisplayAuthor && shouldDisplayTranslator && <div>•</div>}
        {shouldDisplayTranslator && (
          <div>
            <Trans
              i18nKey="learn:article_meta.translator"
              values={meta}
              components={[<span className="font-bold" />]}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default ArticleMeta;
