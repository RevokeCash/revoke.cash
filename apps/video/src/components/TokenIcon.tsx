import { Img, staticFile } from 'remotion';

// Real token logos, downloaded from the logoURIs that the whois service returns for these tokens,
// so they match the icons the site itself serves.
const TOKEN_ICONS: Record<string, string> = {
  USDC: 'images/tokens/usdc.png',
  USDT: 'images/tokens/usdt.png',
  WETH: 'images/tokens/weth.png',
  PEPE: 'images/tokens/pepe.jpeg',
  UNI: 'images/tokens/uni.png',
  ARB: 'images/tokens/arb.jpg',
  LINK: 'images/tokens/link.png',
};

// Some logos (like UNI's unicorn) are transparent cutouts; give them a light coin-like backdrop
// so they don't look like floating shapes on the dark table rows.
const TOKEN_ICON_BACKGROUNDS: Record<string, string> = {
  UNI: '#f4f4f5',
};

export const TokenIcon = ({ symbol, size = 24 }: { symbol: string; size?: number }) => {
  const iconPath = TOKEN_ICONS[symbol];

  if (iconPath) {
    return (
      <Img
        src={staticFile(iconPath)}
        className="shrink-0 rounded-full"
        style={{ width: size, height: size, backgroundColor: TOKEN_ICON_BACKGROUNDS[symbol] }}
      />
    );
  }

  // Fallback for tokens without a downloaded logo: a solid circle with the symbol's first letter,
  // similar to the site's PlaceholderIcon fallback.
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.5, backgroundColor: '#52525b' }}
    >
      {symbol.charAt(0)}
    </div>
  );
};
