import { locales } from 'lib/i18n/config';
import { generateOgImage } from 'lib/utils/og';
import { getTranslations } from 'next-intl/server';

// This is a workaround to enable static OG image generation, see
// https://github.com/vercel/next.js/issues/51147#issuecomment-1842197049

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

export const dynamic = 'force-dynamic';
export const dynamicParams = false;

export const generateStaticParams = () => {
  return locales.map((locale) => ({ locale }));
};

export async function GET(_req: Request, { params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const title = t('learn.meta.title');
  const background = 'https://revoke.cash/assets/images/learn/cover.jpg';

  return await generateOgImage({ title, background });
}
