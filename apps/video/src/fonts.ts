import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

// Same typefaces as the site: Outfit Revoke for headings (font-heading), Inter for everything else.
// The font files are copied from apps/web/public/assets/fonts.
export const headingFontFamily = 'Outfit Revoke';
export const bodyFontFamily = 'Inter';
// Montserrat is only used by the network support graphic, whose Figma template sets it for the "NOW LIVE" label.
export const montserratFontFamily = 'Montserrat';

loadFont({ family: headingFontFamily, url: staticFile('fonts/Outfit-Revoke-SemiBold.ttf'), weight: '600' });
loadFont({ family: bodyFontFamily, url: staticFile('fonts/Inter-Regular.ttf'), weight: '400' });
loadFont({ family: bodyFontFamily, url: staticFile('fonts/Inter-SemiBold.ttf'), weight: '600' });
loadFont({ family: bodyFontFamily, url: staticFile('fonts/Inter-Bold.ttf'), weight: '700' });
loadFont({
  family: montserratFontFamily,
  url: staticFile('fonts/Montserrat-VariableFont_wght.ttf'),
  weight: '100 900',
});
