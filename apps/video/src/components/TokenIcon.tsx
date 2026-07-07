const TOKEN_COLORS: Record<string, string> = {
  USDC: '#2775ca',
  USDT: '#26a17b',
  WETH: '#627eea',
  PEPE: '#3d8130',
  UNI: '#ff007a',
  ARB: '#2d374b',
  LINK: '#2a5ada',
};

// Stand-in for token logos: a solid circle with the symbol's first letter, similar to the
// site's PlaceholderIcon fallback.
export const TokenIcon = ({ symbol, size = 24 }: { symbol: string; size?: number }) => {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.5, backgroundColor: TOKEN_COLORS[symbol] ?? '#52525b' }}
    >
      {symbol.charAt(0)}
    </div>
  );
};
