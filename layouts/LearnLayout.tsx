import Breadcrumb from 'components/common/Breadcrumb';
import Divider from 'components/common/Divider';
import PageNavigation from 'components/common/PageNavigation';
import Prose from 'components/common/Prose';
import TranslateButton from 'components/common/TranslateButton';
import Footer from 'components/footer/Footer';
import Header from 'components/header/Header';
import ArticleMeta from 'components/learn/ArticleMeta';
import Sidebar from 'components/learn/Sidebar';
import { BreadcrumbEntry, ContentMeta, ISidebarEntry } from 'lib/interfaces';
import useTranslation from 'next-translate/useTranslation';
import Image from 'next/image';

interface Props {
  children: React.ReactNode;
  searchBar?: boolean;
  sidebarEntries: ISidebarEntry[];
  slug: string[];
  meta: ContentMeta;
  translationUrl?: string;
}

const LearnLayout = ({ children, searchBar, sidebarEntries, slug, meta, translationUrl }: Props) => {
  const { t } = useTranslation();

  const breadcrumbs: BreadcrumbEntry[] = [{ name: t('common:nav.learn'), href: '/learn' }];

  slug.slice(0, slug.length - 1).forEach((slugPart, i) => {
    breadcrumbs.push({ name: t(`learn:sidebar.${slugPart}`), href: `/learn/${slug.slice(0, i + 1).join('/')}` });
  });

  if (meta.sidebarTitle) breadcrumbs.push({ name: meta.sidebarTitle });

  return (
    <div className="flex flex-col mx-auto min-h-screen">
      <Header searchBar={searchBar} />
      <main className="max-w-6xl w-full mx-auto px-4 lg:px-8 grow">
        <div className="flex flex-col min-w-0 lg:flex-row gap-4">
          <Sidebar entries={sidebarEntries} />
          <div className="min-w-0 w-full">
            <div className="pl-2 pt-2">
              <Breadcrumb pages={breadcrumbs} />
              <TranslateButton language={meta.language} translationUrl={translationUrl} />
            </div>
            <Prose className="mb-4">
              {meta.coverImage ? <Image src={meta.coverImage} alt={meta.title} width={1600} height={900} /> : null}
            </Prose>
            {children}
            <Divider className="my-6" />
            <ArticleMeta meta={meta} />
            <PageNavigation currentPath={`/learn/${slug.join('/')}`} pages={sidebarEntries} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LearnLayout;
