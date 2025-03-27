import { locales } from 'lib/i18n/config';
import { getAllLearnCategories } from 'lib/utils/markdown-content';
import { generateOgImage, loadDataUrl } from 'lib/utils/og';
import { getTranslations } from 'next-intl/server';

// This is a workaround to enable static OG image generation, see
// https://github.com/vercel/next.js/issues/51147#issuecomment-1842197049

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
  category: string;
}

export const dynamic = 'error';
export const dynamicParams = false;

export const generateStaticParams = () => {
  const categorySlugs = getAllLearnCategories();
  return locales.flatMap((locale) => categorySlugs.map((category) => ({ locale, category })));
};

export async function GET(req: Request, { params }: Props) {
  const { locale, category } = await params;
  const t = await getTranslations({ locale });

  const title = t(`learn.sections.${category}.title`);
  const background = loadDataUrl(`public/assets/images/learn/${category}/cover.jpg`, 'image/jpeg');

  return generateOgImage({ title, background });
}
