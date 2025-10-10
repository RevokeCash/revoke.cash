import { locales } from 'lib/i18n/config';
import { getAllContentSlugs, readAndParseContentFile } from 'lib/utils/markdown-content';
import { generateOgImage } from 'lib/utils/og';

// We cannot use [...slug]/open-graph-image.tsx because ridiculously Next App Router doesn't support this,
// even though it is listed as a supported feature in the documentation. 🤬
// https://github.com/vercel/next.js/issues/57349

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
  slug: string[];
}

export const dynamic = 'force-dynamic';
export const dynamicParams = false;

export const generateStaticParams = () => {
  const slugs = getAllContentSlugs('learn');
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
};

export async function GET(_req: Request, { params }: Props) {
  const { locale, slug } = await params;
  const { meta } = readAndParseContentFile(slug, locale, 'learn')!;

  const title = meta.overlay ? meta.sidebarTitle : undefined;

  try {
    const background = `https://revoke.cash/assets/images/learn/${slug.join('/')}/cover.jpg`;
    return await generateOgImage({ title, background });
  } catch {
    const background = 'https://revoke.cash/assets/images/opengraph-image.jpg';
    return await generateOgImage({ title, background });
  }
}
