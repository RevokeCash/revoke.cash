import Divider from 'components/common/Divider';
import PageNavigation from 'components/common/PageNavigation';
import { ContentMeta, ISidebarEntry } from 'lib/interfaces';
import Trans from 'next-translate/Trans';

interface Props {
  slug: string[];
  meta: Pick<ContentMeta, 'author' | 'translator' | 'language'>;
  sidebarEntries: ISidebarEntry[];
  basePath: string;
}

const ArticleMeta = ({ slug, meta, sidebarEntries, basePath }: Props) => {
  const shouldDisplayAuthor = !!meta.author;
  const shouldDisplayTranslator = !!meta.translator && meta.language !== 'en';

  const path = `/${basePath}/${slug.join('/')}`;

  const sidebarPages = sidebarEntries.flatMap((entry) => [entry, ...(entry?.children ?? [])]);
  const currentPageIndex = sidebarPages.findIndex((page) => page.path === path);
  const previousPage = sidebarPages[currentPageIndex - 1];
  const nextPage = sidebarPages[currentPageIndex + 1];

  return (
    <>
      <Divider className="my-6" />
      <PageNavigation previousPage={previousPage} nextPage={nextPage} />
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
