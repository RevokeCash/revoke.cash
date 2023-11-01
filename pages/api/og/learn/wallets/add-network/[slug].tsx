// Note: this file contains TypeScript errors, but these errors are incorrect. I'm not sure how to fix them.

import OgHeaderText from 'components/common/og/OgHeaderText';
import { getChainIdFromSlug, getChainName } from 'lib/utils/chains';
import { ImageResponse, NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
  unstable_allowDynamic: ['/node_modules/gray-matter/**', '/node_modules/js-yaml/**'],
};

// @ts-ignore
const coverBg = fetch(new URL('/public/assets/images/learn/wallets/add-network/cover.jpg', import.meta.url)).then(
  (res) => res.arrayBuffer(),
);

// @ts-ignore
const font = fetch(new URL('/public/assets/fonts/FuturaCondensedBold.otf', import.meta.url)).then((res) =>
  res.arrayBuffer(),
);

const OgImage = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const chainName = getChainName(getChainIdFromSlug(slug));

  const text = `Add ${chainName} To MetaMask`;

  const response = (
    <div tw="relative bg-white w-full h-full flex flex-col text-4xl leading-none items-center justify-center">
      <img tw="absolute" height="900" width="1600" src={(await coverBg) as any} />
      <div style={{ display: 'flex', top: 290 }}>
        <OgHeaderText>{text}</OgHeaderText>
      </div>
    </div>
  );

  return new ImageResponse(response, {
    width: 1600,
    height: 900,
    fonts: [
      {
        name: 'Futura Condensed Bold',
        data: await font,
      },
    ],
  });
};

export default OgImage;
