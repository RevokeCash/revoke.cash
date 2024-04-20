import Breadcrumb from 'components/common/Breadcrumb';
import Divider from 'components/common/Divider';
import PageNavigation from 'components/common/PageNavigation';
import Prose from 'components/common/Prose';
import TranslateButton from 'components/common/TranslateButton';
import ArticleMeta from 'components/learn/ArticleMeta';
import { BreadcrumbEntry, ContentMeta, ISidebarEntry } from 'lib/interfaces';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import ContentPageLayout from './ContentPageLayout';

interface Props {
  children: React.ReactNode;
  posts: ISidebarEntry[];
  slug: string[];
  meta: ContentMeta;
  translationUrl?: string;
}

const BlogLayout = ({ children, posts, slug, meta, translationUrl }: Props) => {
  const t = useTranslations();

  const breadcrumbs: BreadcrumbEntry[] = [{ name: t('common.nav.blog'), href: '/blog' }];
  if (meta.sidebarTitle) breadcrumbs.push({ name: meta.sidebarTitle });

  return (
    <ContentPageLayout searchBar={false}>
      <div className="pl-2 pt-2">
        <Breadcrumb pages={breadcrumbs} />
        <TranslateButton language={meta.language} translationUrl={translationUrl} />
      </div>
      <Prose className="mb-4">
        {meta.coverImage ? <Image src={meta.coverImage} alt={meta.title} width={1600} height={900} /> : null}
      </Prose>
      <ArticleMeta meta={meta} />
      {children}
      <Divider className="my-6" />
      <PageNavigation currentPath={`/blog/${slug.join('/')}`} pages={posts} />
    </ContentPageLayout>
  );
};

export default BlogLayout;
