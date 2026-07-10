import { Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ShowcaseFrame } from '../components/ShowcaseFrame';
import { TokenIcon } from '../components/TokenIcon';
import { popIn, riseIn } from '../motion';

// Animated mockup for the premium pricing page's feature showcase (1200x630): the multichain
// dashboard assembling, with approvals from different networks sliding into one list. Rendered to
// apps/web/public/assets/videos/premium/multichain-dashboard.mp4; the final frame doubles as the
// poster at apps/web/public/assets/images/premium/multichain-dashboard.jpg.

interface ApprovalRow {
  chainLogo: string;
  symbol: string;
  spender: string;
}

const APPROVAL_ROWS: ApprovalRow[] = [
  { chainLogo: 'images/chains/ethereum.svg', symbol: 'USDC', spender: 'Uniswap Permit2' },
  { chainLogo: 'images/chains/base.svg', symbol: 'WETH', spender: 'Seaport 1.5 (OpenSea)' },
  { chainLogo: 'images/chains/polygon.svg', symbol: 'UNI', spender: 'SushiSwap Router' },
  { chainLogo: 'images/chains/arbitrum.svg', symbol: 'LINK', spender: '1inch Router v4' },
];

const HEADER_CHAIN_LOGOS = [
  'images/chains/ethereum.svg',
  'images/chains/base.svg',
  'images/chains/arbitrum.svg',
  'images/chains/optimism.svg',
  'images/chains/polygon.svg',
];

export const MultichainDashboardShowcase = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <ShowcaseFrame title="Approvals" headerRight={<HeaderChainCluster frame={frame} fps={fps} />}>
      <div className="divide-y divide-zinc-800">
        {APPROVAL_ROWS.map((row, index) => (
          <div
            key={row.symbol}
            className="flex items-center justify-between gap-5 px-10 py-5"
            style={riseIn(frame, fps, 12 + index * 7)}
          >
            <div className="flex items-center gap-3">
              <Img src={staticFile(row.chainLogo)} className="h-8 w-8 rounded-full" />
              <TokenIcon symbol={row.symbol} size={36} />
              <span className="text-2xl font-medium text-zinc-100">{row.symbol}</span>
              <span className="text-2xl text-zinc-400">{row.spender}</span>
            </div>
            <div className="rounded-lg border border-zinc-700 px-6 py-2 text-lg font-medium text-white">Revoke</div>
          </div>
        ))}
      </div>
    </ShowcaseFrame>
  );
};

const HeaderChainCluster = ({ frame, fps }: { frame: number; fps: number }) => {
  return (
    <div className="flex -space-x-3">
      {HEADER_CHAIN_LOGOS.map((logo, index) => (
        <Img
          key={logo}
          src={staticFile(logo)}
          className="h-9 w-9 rounded-full border-2 border-black"
          style={popIn(frame, fps, 5 + index * 4)}
        />
      ))}
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-black bg-zinc-800 text-xs font-semibold text-zinc-300"
        style={popIn(frame, fps, 5 + HEADER_CHAIN_LOGOS.length * 4)}
      >
        99+
      </div>
    </div>
  );
};
