import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Pill } from '../components/Pill';
import { ShowcaseFrame } from '../components/ShowcaseFrame';
import { TokenIcon } from '../components/TokenIcon';
import { popIn, pulseOnce, riseIn } from '../motion';

// Animated mockup for the landing page's feature showcase (1200x630): the single-chain approvals
// dashboard, where the USDC approval gets revoked while you watch. Rendered to
// apps/web/public/assets/videos/landing/dashboard.mp4; the final frame doubles as the poster at
// apps/web/public/assets/images/landing/dashboard.jpg.

interface ApprovalRow {
  symbol: string;
  spender: string;
  getsRevoked: boolean;
}

const APPROVAL_ROWS: ApprovalRow[] = [
  { symbol: 'USDC', spender: 'Uniswap Permit2', getsRevoked: true },
  { symbol: 'WETH', spender: 'Seaport 1.5 (OpenSea)', getsRevoked: false },
  { symbol: 'UNI', spender: 'SushiSwap Router', getsRevoked: false },
  { symbol: 'LINK', spender: '1inch Router v4', getsRevoked: false },
];

const REVOKE_BUTTON_PULSE_AT = 95;
const REVOKED_AT = 110;
const ROW_DIM_DURATION_IN_FRAMES = 15;

export const ApprovalDashboardShowcase = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <ShowcaseFrame title="Approvals" headerRight={<HeaderChainChip frame={frame} fps={fps} />}>
      <div className="divide-y divide-zinc-800">
        {APPROVAL_ROWS.map((row, index) => (
          <div
            key={row.symbol}
            className="flex items-center justify-between gap-5 px-10 py-5"
            style={riseIn(frame, fps, 12 + index * 7)}
          >
            <div className="flex items-center gap-3" style={{ opacity: revokedRowOpacity(frame, row) }}>
              <TokenIcon symbol={row.symbol} size={36} />
              <span className="text-2xl font-medium text-zinc-100">{row.symbol}</span>
              <span className="text-2xl text-zinc-400">{row.spender}</span>
            </div>
            <RevokeActionCell frame={frame} fps={fps} row={row} />
          </div>
        ))}
      </div>
    </ShowcaseFrame>
  );
};

// The revoked row's left content dims once the revoke lands, so the poster reads as one handled
// approval among three that are still active.
const revokedRowOpacity = (frame: number, row: ApprovalRow) => {
  if (!row.getsRevoked) return 1;
  return interpolate(frame, [REVOKED_AT, REVOKED_AT + ROW_DIM_DURATION_IN_FRAMES], [1, 0.45], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

const HeaderChainChip = ({ frame, fps }: { frame: number; fps: number }) => {
  return (
    <div
      className="flex items-center gap-3 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1.5"
      style={popIn(frame, fps, 5)}
    >
      <Img src={staticFile('images/chains/ethereum.svg')} className="h-6 w-6 rounded-full" />
      <span className="text-lg text-zinc-300">Ethereum</span>
    </div>
  );
};

// The row's action: a Revoke button that gets pressed, then swaps to a green Revoked status pill.
// Both states render inside the same fixed footprint so the swap doesn't reflow the rows around it.
const RevokeActionCell = ({ frame, fps, row }: { frame: number; fps: number; row: ApprovalRow }) => {
  const showRevokedPill = row.getsRevoked && frame >= REVOKED_AT;

  return (
    <div className="flex h-[46px] w-[118px] items-center justify-center">
      {showRevokedPill ? (
        <RevokedStatusPill frame={frame} fps={fps} />
      ) : (
        <RevokeButton frame={frame} fps={fps} row={row} />
      )}
    </div>
  );
};

const RevokeButton = ({ frame, fps, row }: { frame: number; fps: number; row: ApprovalRow }) => {
  const clickPulse = row.getsRevoked ? pulseOnce(frame, fps, REVOKE_BUTTON_PULSE_AT) : undefined;

  return (
    <div className="rounded-lg border border-zinc-700 px-6 py-2 text-lg font-medium text-white" style={clickPulse}>
      Revoke
    </div>
  );
};

const RevokedStatusPill = ({ frame, fps }: { frame: number; fps: number }) => {
  const changePop = spring({ frame: frame - REVOKED_AT, fps, durationInFrames: 15 });

  return (
    <div style={{ transform: `scale(${interpolate(changePop, [0, 1], [0.7, 1])})` }}>
      <Pill className="bg-green-900/40 px-5 py-1.5 text-lg text-green-400">Revoked</Pill>
    </div>
  );
};
