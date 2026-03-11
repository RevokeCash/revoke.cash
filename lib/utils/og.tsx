import OgHeaderText from 'components/common/og/OgHeaderText';
import ky from 'lib/ky';
import { ImageResponse } from 'next/og';

interface OgImageProps {
  title?: string;
  background: string;
}

export const generateOgImage = async ({ title, background }: OgImageProps) => {
  const width = 1200;
  const height = 630;

  const response = (
    <div tw="relative bg-white w-full h-full flex flex-col text-4xl leading-none items-center justify-center">
      {/* biome-ignore lint/performance/noImgElement: this rule does not apply in OG image generation */}
      <img tw="absolute" height={height} width={width} src={background} alt="Background" />
      {/* biome-ignore lint/performance/noImgElement: this rule does not apply in OG image generation */}
      <img
        tw="absolute top-10 left-10"
        height="96"
        width="96"
        src={'https://revoke.cash/assets/images/revoke-icon-orange-black.png'}
        alt="Revoke icon"
      />
      {title ? (
        <div style={{ display: 'flex', top: 192 }}>
          <OgHeaderText>{title}</OgHeaderText>
        </div>
      ) : null}
    </div>
  );

  return new ImageResponse(response, {
    width,
    height,
    fonts: [
      {
        name: 'Inter Bold',
        data: await ky.get('https://revoke.cash/assets/fonts/Inter-Bold.ttf').arrayBuffer(),
      },
    ],
  });
};

export const getOpenGraphImageUrl = (url: string, locale: string) => {
  return `/${locale}/og.jpg${url}`;
};
