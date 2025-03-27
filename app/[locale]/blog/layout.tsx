import SharedLayout from 'app/layouts/SharedLayout';
import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

const BlogPageLayout = async ({ params, children }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <SharedLayout searchBar={true} padding>
      <div className="w-full max-w-7xl mx-auto">{children}</div>
    </SharedLayout>
  );
};

export default BlogPageLayout;
