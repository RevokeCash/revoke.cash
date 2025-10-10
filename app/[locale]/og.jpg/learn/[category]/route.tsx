import { locales } from 'lib/i18n/config';
import { getAllLearnCategories } from 'lib/utils/markdown-content';
import { generateOgImage } from 'lib/utils/og';
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

export const dynamic = 'force-dynamic';
export const dynamicParams = false;

export const generateStaticParams = () => {
  const categorySlugs = getAllLearnCategories();
  return locales.flatMap((locale) => categorySlugs.map((category) => ({ locale, category })));
};

export async function GET(_req: Request, { params }: Props) {
  const { locale, category } = await params;
  const t = await getTranslations({ locale });

  const title = t(`learn.sections.${category}.title`);
  const background = `https://revoke.cash/assets/images/learn/${category}/cover.jpg`;

  return await generateOgImage({ title, background });
}
