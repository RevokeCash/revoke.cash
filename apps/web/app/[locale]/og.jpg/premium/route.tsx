import { AUTO_REVOKE_MONTHLY_GAS_BUDGET_USD } from '@revoke.cash/core/auto-revoke/config';
import { FEATURES, TIER_MAX_ADDRESSES, type TierKey } from 'components/premium/pricing/pricing-data';
import { locales } from 'lib/i18n/routing';
import {
  getInterBoldFontData,
  getInterRegularFontData,
  getInterSemiBoldFontData,
  getOutfitRevokeSemiBoldFontData,
} from 'lib/utils/fonts.server';
import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

// This is a workaround to enable static OG image generation, see
// https://github.com/vercel/next.js/issues/51147#issuecomment-1842197049

// Custom OG image for the premium pricing page: the two paid tier cards over the site's regular
// OG backdrop. Prices mirror the hardcoded props in PremiumPricingPageContent; the feature
// bullets are derived from the same FEATURES data and translations as the real tier cards.

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

type Translator = Awaited<ReturnType<typeof getTranslations>>;

interface OgTierCard {
  name: string;
  price: string;
  priceNote: string;
  savings: string;
  badge: { label: string; background: string };
  borderColor: string;
  includesLine: string;
  features: string[];
}

export async function GET(_req: Request, { params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const cards: OgTierCard[] = [
    {
      name: t('premium.pricing.tiers.premium.name'),
      price: '$99',
      priceNote: buildPriceNote(t, 'premium'),
      savings: t('premium.pricing.tiers.premium.savings', { price: '$0.83' }),
      badge: { label: t('premium.pricing.most_popular_label'), background: '#fdb952' },
      borderColor: 'rgba(253, 185, 82, 0.7)',
      includesLine: t('premium.pricing.includes_tier', { tierName: t('premium.pricing.tiers.free.name') }),
      features: getCardFeatureLabels(t, 'premium', 'free'),
    },
    {
      name: t('premium.pricing.tiers.ultimate.name'),
      price: '$199',
      priceNote: buildPriceNote(t, 'ultimate'),
      savings: t('premium.pricing.tiers.ultimate.savings', { price: '$1.66' }),
      badge: { label: t('premium.pricing.best_protection'), background: '#e4e4e7' },
      borderColor: '#e4e4e7',
      includesLine: t('premium.pricing.includes_tier', { tierName: t('premium.pricing.tiers.premium.name') }),
      features: getCardFeatureLabels(t, 'ultimate', 'premium'),
    },
  ];

  const [interRegular, interSemiBold, interBold, outfitSemiBold] = await Promise.all([
    getInterRegularFontData(),
    getInterSemiBoldFontData(),
    getInterBoldFontData(),
    getOutfitRevokeSemiBoldFontData(),
  ]);

  const response = (
    <div style={{ display: 'flex', position: 'relative', width: '100%', height: '100%', background: 'black' }}>
      {/* biome-ignore lint/performance/noImgElement: this rule does not apply in OG image generation */}
      <img
        style={{ position: 'absolute', opacity: 0.9 }}
        height={630}
        width={1200}
        src="https://revoke.cash/assets/images/cover-template.jpg"
        alt="Background"
      />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '48px 64px 56px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* biome-ignore lint/performance/noImgElement: this rule does not apply in OG image generation */}
          <img
            height={36}
            width={156}
            src="https://revoke.cash/assets/images/revoke-wordmark-orange.svg"
            alt="Revoke"
          />
          <span style={{ fontFamily: 'Outfit Revoke', fontWeight: 600, fontSize: 36, color: 'white' }}>
            {t('premium.pricing.meta.title')}
          </span>
        </div>
        <div style={{ display: 'flex', flex: 1, gap: 32, marginTop: 44 }}>
          {cards.map((card) => (
            <TierCard key={card.name} card={card} />
          ))}
        </div>
      </div>
    </div>
  );

  return new ImageResponse(response, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: interRegular, weight: 400 },
      { name: 'Inter', data: interSemiBold, weight: 600 },
      { name: 'Inter', data: interBold, weight: 700 },
      { name: 'Outfit Revoke', data: outfitSemiBold, weight: 600 },
    ],
  });
}

const buildPriceNote = (t: Translator, tierKey: TierKey) => {
  const perYear = t('premium.pricing.per_year');
  const priceNote = t(`premium.pricing.tiers.${tierKey}.price_note`, { count: TIER_MAX_ADDRESSES[tierKey] });
  return `${perYear} • ${priceNote}`;
};

// Mirrors the FeatureList logic in TierCard.tsx: the features this tier adds on top of the tier
// it references, using the card-specific label overrides.
const getCardFeatureLabels = (t: Translator, tierKey: TierKey, referencesTier: TierKey): string[] => {
  const uniqueFeatures = FEATURES.filter(
    (feature) =>
      !feature.comparisonOnly &&
      feature[tierKey] !== false &&
      (feature[referencesTier] === false || feature.upgradedIn?.includes(tierKey)),
  );

  return uniqueFeatures.map((feature) =>
    t(`premium.pricing.features.${feature.cardLabelKey?.[tierKey] ?? feature.labelKey}`, {
      price: '$1.50',
      budget: `$${AUTO_REVOKE_MONTHLY_GAS_BUDGET_USD}`,
    }),
  );
};

const TierCard = ({ card }: { card: OgTierCard }) => {
  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        flexDirection: 'column',
        flex: 1,
        borderRadius: 16,
        border: `3px solid ${card.borderColor}`,
        background: 'rgba(0, 0, 0, 0.8)',
        padding: 32,
      }}
    >
      <div style={{ display: 'flex', position: 'absolute', top: -18, left: 0, right: 0, justifyContent: 'center' }}>
        <div
          style={{
            display: 'flex',
            background: card.badge.background,
            color: '#18181b',
            borderRadius: 9999,
            padding: '5px 16px',
            fontFamily: 'Inter',
            fontWeight: 600,
            fontSize: 18,
          }}
        >
          {card.badge.label}
        </div>
      </div>

      <span style={{ fontFamily: 'Outfit Revoke', fontWeight: 600, fontSize: 27, color: '#fafafa' }}>{card.name}</span>
      {/* Satori mishandles baseline alignment across font sizes, so bottom-align with a small
          margin compensating for the descender-height difference between the two font sizes. */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 4 }}>
        <span style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 46, lineHeight: 1, color: 'white' }}>
          {card.price}
        </span>
        <span style={{ fontFamily: 'Inter', fontSize: 20, lineHeight: 1, color: '#a1a1aa', marginBottom: 6 }}>
          {card.priceNote}
        </span>
      </div>
      <div style={{ display: 'flex', marginTop: 10 }}>
        <div
          style={{
            display: 'flex',
            background: 'rgba(20, 83, 45, 0.4)',
            color: '#4ade80',
            borderRadius: 9999,
            padding: '4px 14px',
            fontFamily: 'Inter',
            fontWeight: 600,
            fontSize: 17,
          }}
        >
          {card.savings}
        </div>
      </div>

      <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 19, color: '#a1a1aa', marginTop: 24 }}>
        {card.includesLine}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginTop: 14 }}>
        {card.features.map((feature) => (
          <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckIcon />
            <span style={{ fontFamily: 'Inter', fontSize: 21, color: '#e4e4e7' }}>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Heroicons 24/solid CheckIcon, as used in the real tier cards (dark mode green-400).
const CheckIcon = () => (
  // biome-ignore lint/a11y/noSvgWithoutTitle: this rule does not apply in OG image generation
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#4ade80">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
    />
  </svg>
);
