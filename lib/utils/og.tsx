import OgHeaderText from 'components/common/og/OgHeaderText';
import { readFileSync } from 'fs';
import { ImageResponse } from 'next/og';
import { join } from 'path';

// Note: this does not work in Edge runtime

export const loadFile = (relPath: string): Buffer => {
  return readFileSync(join(process.cwd(), relPath));
};

export const loadDataUrl = (relPath: string, mimeType: string): string => {
  const fileData = loadFile(relPath);
  const base64Data = fileData.toString('base64');
  return `data:${mimeType};base64,${base64Data}`;
};

interface OgImageProps {
  title?: string;
  background: string;
}

export const generateOgImage = ({ title, background }: OgImageProps) => {
  const width = 1200;
  const height = 630;

  const icon = loadDataUrl('public/assets/images/revoke-icon-orange-black.png', 'image/png');

  const response = (
    <div tw="relative bg-white w-full h-full flex flex-col text-4xl leading-none items-center justify-center">
      {/* biome-ignore lint/performance/noImgElement: this rule does not apply in OG image generation */}
      <img tw="absolute" height={height} width={width} src={background} alt="Background" />
      {/* biome-ignore lint/performance/noImgElement: this rule does not apply in OG image generation */}
      <img tw="absolute top-10 left-10" height="96" width="96" src={icon} alt="Revoke icon" />
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
        data: loadFile('public/assets/fonts/Inter-Bold.ttf'),
      },
    ],
  });
};

export const getOpenGraphImageUrl = (url: string, locale: string) => {
  return `/${locale}/og.jpg${url}`;
};
