import { locales } from 'lib/i18n/config';
import { getAllContentSlugs, readAndParseContentFile } from 'lib/utils/markdown-content';
import { generateOgImage, loadDataUrl } from 'lib/utils/og';

// We cannot use [...slug]/open-graph-image.tsx because ridiculously Next App Router doesn't support this,
// even though it is listed as a supported feature in the documentation. 🤬
// https://github.com/vercel/next.js/issues/57349

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

export async function GET(req: Request, { params }: Props) {
  const { meta } = readAndParseContentFile(params.slug, params.locale, 'learn');

  const title = meta.overlay ? meta.sidebarTitle : undefined;
  const background = loadDataUrl(`public/assets/images/learn/${params.slug.join('/')}/cover.jpg`, 'image/jpeg');

  return generateOgImage({ title, background });
}
