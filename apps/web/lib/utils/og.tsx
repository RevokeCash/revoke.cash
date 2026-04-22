import ky from 'lib/ky';
import { ImageResponse } from 'next/og';

interface OgImageProps {
  title?: string;
  readingTime?: number;
  author?: string;
  background: string;
}

export const generateOgImage = async ({ title, readingTime, author, background }: OgImageProps) => {
  const width = 1200;
  const height = 630;
  const wordmark = 'https://revoke.cash/assets/images/revoke-wordmark-orange.svg';

  const meta = [readingTime ? `${readingTime} min read` : null, author ? `by ${author}` : null]
    .filter(Boolean)
    .join(', ');

  const titleFontSize = title && title.length > 50 ? 80 : 108;

  const response = (
    <div tw="relative bg-black w-full h-full flex flex-col">
      {/* biome-ignore lint/performance/noImgElement: this rule does not apply in OG image generation */}
      <img tw="absolute" height={height} width={width} src={background} alt="Background" style={{ opacity: 0.9 }} />
      <div tw="flex flex-col justify-between h-full" style={{ padding: '64px 64px 64px 120px' }}>
        {/* biome-ignore lint/performance/noImgElement: this rule does not apply in OG image generation */}
        <img height="32" src={wordmark} alt="Revoke" />
        {title ? (
          <div
            style={{
              fontFamily: 'Outfit SemiBold',
              fontSize: titleFontSize,
              color: 'white',
              letterSpacing: '-3px',
              lineHeight: 1.05,
              maxWidth: '950px',
            }}
          >
            {title}
          </div>
        ) : null}
        {meta ? (
          <div style={{ fontFamily: 'Inter Bold', fontSize: 28, color: 'rgba(255, 255, 255, 0.65)' }}>{meta}</div>
        ) : (
          <div />
        )}
      </div>
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
      {
        name: 'Outfit SemiBold',
        data: await ky
          .get('https://fonts.gstatic.com/s/outfit/v15/QGYyz_MVcBeNP4NjuGObqx1XmO1I4e6yC4E.ttf') // TODO: update URL after production deployment
          .arrayBuffer(),
      },
    ],
  });
};

export const getOpenGraphImageUrl = (url: string, locale: string) => {
  return `/${locale}/og.jpg${url}`;
};
