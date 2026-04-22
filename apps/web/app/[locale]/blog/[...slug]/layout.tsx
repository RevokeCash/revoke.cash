import Breadcrumb from 'components/common/Breadcrumb';
import Divider from 'components/common/Divider';
import PageNavigation from 'components/common/PageNavigation';
import TranslateButton from 'components/common/TranslateButton';
import type { BreadcrumbEntry } from 'lib/interfaces';
import { getSidebar, getTranslationUrl, readAndParseContentFile } from 'lib/utils/markdown-content';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

interface Props {
  params: Promise<Params>;
  children: ReactNode;
}

interface Params {
  locale: string;
  slug: string[];
}

const BlogLayout = async ({ params, children }: Props) => {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const { meta } = readAndParseContentFile(slug, locale, 'blog')!;
  const posts = await getSidebar(locale, 'blog');
  const translationUrl = await getTranslationUrl(slug, locale, 'blog');

  const breadcrumbs: BreadcrumbEntry[] = [{ name: t('common.nav.blog'), href: '/blog' }];
  if (meta.sidebarTitle) breadcrumbs.push({ name: meta.sidebarTitle });

  return (
    <>
      <div vocab="https://schema.org/" typeof="Article">
        <div hidden className="hidden" property="headline" content={meta.title} />
        {meta.author && (
          <div property="author" typeof="Person">
            <div hidden className="hidden" property="name" content={meta.author.name} />
          </div>
        )}
        <div hidden className="hidden" property="datePublished" content={meta.date} />
        {meta.coverImage && (
          <div hidden className="hidden" property="image" content={`https://revoke.cash${meta.coverImage}`} />
        )}
      </div>
      <div className="max-w-3xl mx-auto">
        <div className="pl-2 pt-2">
          <Breadcrumb pages={breadcrumbs} />
          <TranslateButton language={meta.language} translationUrl={translationUrl} />
        </div>
        {children}
        <Divider className="my-6" />
        <PageNavigation currentPath={`/blog/${slug.join('/')}`} pages={[...posts].reverse()} />
      </div>
    </>
  );
};

export default BlogLayout;
