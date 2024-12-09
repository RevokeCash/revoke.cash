import Breadcrumb from 'components/common/Breadcrumb';
import Divider from 'components/common/Divider';
import PageNavigation from 'components/common/PageNavigation';
import Prose from 'components/common/Prose';
import TranslateButton from 'components/common/TranslateButton';
import ArticleMeta from 'components/learn/ArticleMeta';
import Sidebar from 'components/learn/Sidebar';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import type { BreadcrumbEntry, ContentMeta, ISidebarEntry } from 'lib/interfaces';
import { useMessages, useTranslations } from 'next-intl';
import Image from 'next/image';
import SharedLayout from './SharedLayout';

interface Props {
  children: React.ReactNode;
  searchBar?: boolean;
  sidebarEntries: ISidebarEntry[];
  slug: string[];
  meta: ContentMeta;
  translationUrl?: string;
}

// TODO: Make this into a nested layout
const LearnLayout = ({ children, searchBar, sidebarEntries, slug, meta, translationUrl }: Props) => {
  const messages = useMessages();
  const t = useTranslations();

  const breadcrumbs: BreadcrumbEntry[] = [{ name: t('common.nav.learn'), href: '/learn' }];

  slug.slice(0, slug.length - 1).forEach((slugPart, i) => {
    breadcrumbs.push({ name: t(`learn.sidebar.${slugPart}`), href: `/learn/${slug.slice(0, i + 1).join('/')}` });
  });

  if (meta.sidebarTitle) breadcrumbs.push({ name: meta.sidebarTitle });

  return (
    <SharedLayout searchBar={searchBar} padding>
      <div className="max-w-6xl w-full mx-auto grow">
        <div className="flex flex-col min-w-0 lg:flex-row gap-4">
          <NextIntlClientProvider messages={{ learn: messages.learn }}>
            <Sidebar entries={sidebarEntries} />
          </NextIntlClientProvider>
          <div className="min-w-0 w-full">
            <div className="pl-2 pt-2">
              <Breadcrumb pages={breadcrumbs} />
              <TranslateButton language={meta.language} translationUrl={translationUrl} />
            </div>
            <Prose className="mb-4">
              {meta.coverImage ? (
                <Image src={meta.coverImage} alt={meta.title} width={1200} height={630} priority fetchPriority="high" />
              ) : null}
            </Prose>
            {children}
            <Divider className="my-6" />
            <PageNavigation currentPath={`/learn/${slug.join('/')}`} pages={sidebarEntries} />
            <ArticleMeta meta={meta} />
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

export default LearnLayout;
