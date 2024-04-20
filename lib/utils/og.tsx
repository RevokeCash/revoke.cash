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
  title: string;
  background: string;
}

export const generateOgImage = ({ title, background }: OgImageProps) => {
  // TODO: Fix size (should be 1200x630)
  const width = 1600;
  const height = 900;

  const response = (
    <div tw="relative bg-white w-full h-full flex flex-col text-4xl leading-none items-center justify-center">
      <img tw="absolute" height={height} width={width} src={background} />
      <div style={{ display: 'flex', top: 290 }}>
        <OgHeaderText>{title}</OgHeaderText>
      </div>
    </div>
  );

  return new ImageResponse(response, {
    width,
    height,
    fonts: [
      {
        name: 'Futura Condensed Bold',
        data: loadFile('public/assets/fonts/FuturaCondensedBold.otf'),
      },
    ],
  });
};
