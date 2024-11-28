import SharedLayout from 'app/layouts/SharedLayout';
import { unstable_setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  params: {
    locale: string;
    addressOrName: string;
  };
}

const BlogPageLayout = async ({ params, children }: Props) => {
  unstable_setRequestLocale(params.locale);

  return (
    <SharedLayout searchBar={true} padding>
      <div className="w-full max-w-7xl mx-auto">{children}</div>
    </SharedLayout>
  );
};

export default BlogPageLayout;
