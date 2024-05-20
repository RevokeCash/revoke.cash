import Breadcrumb from 'components/common/Breadcrumb';
import Divider from 'components/common/Divider';
import PageNavigation from 'components/common/PageNavigation';
import Prose from 'components/common/Prose';
import TranslateButton from 'components/common/TranslateButton';
import ArticleMeta from 'components/learn/ArticleMeta';
import { BreadcrumbEntry } from 'lib/interfaces';
import { getSidebar, getTranslationUrl, readAndParseContentFile } from 'lib/utils/markdown-content';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import { ReactNode } from 'react';

interface Props {
  params: {
    locale: string;
    slug: string[];
  };
  children: ReactNode;
}

const BlogLayout = async ({ params, children }: Props) => {
  unstable_setRequestLocale(params.locale);

  const t = await getTranslations({ locale: params.locale });
  const { meta } = readAndParseContentFile(params.slug, params.locale, 'blog');
  const posts = await getSidebar(params.locale, 'blog');
  const translationUrl = await getTranslationUrl(params.slug, params.locale, 'blog');

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
        <Prose className="mb-4">
          {meta.coverImage ? <Image src={meta.coverImage} alt={meta.title} width={1200} height={630} /> : null}
        </Prose>
        <ArticleMeta meta={meta} />
        {children}
        <Divider className="my-6" />
        <PageNavigation currentPath={`/blog/${params.slug.join('/')}`} pages={[...posts].reverse()} />
      </div>
    </>
  );
};

export default BlogLayout;
