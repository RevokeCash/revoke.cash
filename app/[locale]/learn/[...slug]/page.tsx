import LearnLayout from 'app/layouts/LearnLayout';
import MarkdownProse from 'components/common/MarkdownProse';
import { locales } from 'lib/i18n/config';
import { getAllContentSlugs, getSidebar, getTranslationUrl, readAndParseContentFile } from 'lib/utils/markdown-content';
import { Metadata, NextPage } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';

interface Props {
  params: {
    locale: string;
    slug: string[];
  };
}

export const dynamic = 'error';
export const dynamicParams = false;

export const generateStaticParams = () => {
  const slugs = getAllContentSlugs('learn');
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
};

export const generateMetadata = async ({ params: { locale, slug } }: Props): Promise<Metadata> => {
  const { meta } = readAndParseContentFile(slug, locale, 'learn')!;

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      images: meta.coverImage,
    },
  };
};

const LearnDocumentPage: NextPage<Props> = async ({ params }) => {
  unstable_setRequestLocale(params.locale);

  const { content, meta } = readAndParseContentFile(params.slug, params.locale, 'learn')!;
  const sidebar = await getSidebar(params.locale, 'learn');
  const translationUrl = await getTranslationUrl(params.slug, params.locale, 'learn');

  return (
    <>
      <div vocab="https://schema.org/" typeof="Article">
        <div hidden className="hidden" property="headline" content={meta.title} />
        {meta.coverImage && (
          <div hidden className="hidden" property="image" content={`https://revoke.cash${meta.coverImage}`} />
        )}
      </div>
      <LearnLayout sidebarEntries={sidebar} slug={params.slug} meta={meta} translationUrl={translationUrl}>
        <MarkdownProse content={content} />
      </LearnLayout>
    </>
  );
};

export default LearnDocumentPage;
