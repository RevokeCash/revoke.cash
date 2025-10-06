import LearnLayout from 'app/layouts/LearnLayout';
import MarkdownProse from 'components/common/MarkdownProse';
import { locales } from 'lib/i18n/config';
import { getAllContentSlugs, getSidebar, getTranslationUrl, readAndParseContentFile } from 'lib/utils/markdown-content';
import type { Metadata, NextPage } from 'next';
import { setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
  slug: string[];
}

export const dynamic = 'error';
export const dynamicParams = false;

export const generateStaticParams = () => {
  const slugs = getAllContentSlugs('learn');
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale, slug } = await params;

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
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const { content, meta } = readAndParseContentFile(slug, locale, 'learn')!;
  const sidebar = await getSidebar(locale, 'learn');
  const translationUrl = await getTranslationUrl(slug, locale, 'learn');

  return (
    <>
      <div vocab="https://schema.org/" typeof="Article">
        <div hidden className="hidden" property="headline" content={meta.title} />
        {meta.coverImage && (
          <div hidden className="hidden" property="image" content={`https://revoke.cash${meta.coverImage}`} />
        )}
      </div>
      <LearnLayout sidebarEntries={sidebar} slug={slug} meta={meta} translationUrl={translationUrl}>
        <MarkdownProse meta={meta} content={content} />
      </LearnLayout>
    </>
  );
};

export default LearnDocumentPage;
