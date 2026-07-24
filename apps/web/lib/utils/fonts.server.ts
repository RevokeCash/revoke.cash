import ky from '@revoke.cash/core/ky';
import { singleton } from '@revoke.cash/core/utils';
import 'server-only';

const FONT_BASE_URL = 'https://revoke.cash/assets/fonts';

export const getInterRegularFontData = singleton(() =>
  ky.get(`${FONT_BASE_URL}/Inter-Regular.ttf`, { cache: 'force-cache' }).arrayBuffer(),
);

export const getInterSemiBoldFontData = singleton(() =>
  ky.get(`${FONT_BASE_URL}/Inter-SemiBold.ttf`, { cache: 'force-cache' }).arrayBuffer(),
);

export const getInterBoldFontData = singleton(() =>
  ky.get(`${FONT_BASE_URL}/Inter-Bold.ttf`, { cache: 'force-cache' }).arrayBuffer(),
);

export const getOutfitRevokeSemiBoldFontData = singleton(() =>
  ky.get(`${FONT_BASE_URL}/Outfit-Revoke-SemiBold.ttf`, { cache: 'force-cache' }).arrayBuffer(),
);
