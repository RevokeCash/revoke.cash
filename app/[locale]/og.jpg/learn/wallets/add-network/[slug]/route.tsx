import { locales } from 'lib/i18n/config';
import { SUPPORTED_CHAINS, getChainIdFromSlug, getChainName, getChainSlug } from 'lib/utils/chains';
import { generateOgImage, loadDataUrl } from 'lib/utils/og';
import { getTranslations } from 'next-intl/server';

// This is a workaround to enable static OG image generation, see
// https://github.com/vercel/next.js/issues/51147#issuecomment-1842197049

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
  slug: string;
}

export const dynamic = 'error';
export const dynamicParams = false;

export const generateStaticParams = () => {
  const slugs = SUPPORTED_CHAINS.map(getChainSlug);
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
};

export async function GET(req: Request, { params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale });

  const chainName = getChainName(getChainIdFromSlug(slug));
  const title = t('learn.add_network.title', { chainName });
  const background = loadDataUrl('public/assets/images/learn/wallets/add-network/cover.jpg', 'image/jpeg');

  return generateOgImage({ title, background });
}
