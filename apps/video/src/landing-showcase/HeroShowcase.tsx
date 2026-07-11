import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Pill } from '../components/Pill';
import { TokenIcon } from '../components/TokenIcon';
import { popIn, pulseOnce, riseIn } from '../motion';

// Animated mockup for the landing page hero (1200x900): the approvals dashboard, where an
// exploited approval gets flagged and revoked, then a stale one, and the total value at risk
// counts down to zero. Rendered to apps/web/public/assets/videos/landing/hero.mp4; the final
// frame doubles as the poster at apps/web/public/assets/images/landing/hero.jpg. Unlike the
// feature showcases this fills the whole frame without the ShowcaseFrame backdrop, because the
// hero renders it larger and the web page wraps it in its own rounded border card.

interface HeroApprovalRow {
  symbol: string;
  spender: string;
  valueAtRisk: number;
  exploited?: boolean;
  // Timing for rows that get revoked during the animation: the button pulses, then the revoke
  // lands and the row's value at risk ticks down to zero.
  revokePulseAt?: number;
  revokedAt?: number;
}

const APPROVAL_ROWS: HeroApprovalRow[] = [
  {
    symbol: 'USDC',
    spender: 'Multichain Bridge',
    valueAtRisk: 395.6,
    exploited: true,
    revokePulseAt: 88,
    revokedAt: 102,
  },
  { symbol: 'WETH', spender: 'SushiSwap Router', valueAtRisk: 32.4, revokePulseAt: 150, revokedAt: 164 },
  { symbol: 'UNI', spender: 'Uniswap Permit2', valueAtRisk: 0 },
  { symbol: 'PEPE', spender: 'Seaport 1.5 (OpenSea)', valueAtRisk: 0 },
  { symbol: 'LINK', spender: '1inch Router v4', valueAtRisk: 0 },
  { symbol: 'ARB', spender: 'Arbitrum Bridge', valueAtRisk: 0 },
];

const EXPLOIT_FLAGGED_AT = 52;
const VALUE_TICK_DURATION_IN_FRAMES = 25;
const ROW_DIM_DURATION_IN_FRAMES = 15;
// Right after the second value tick settles at zero.
const PROTECTED_PILL_AT = 192;

export const HeroShowcase = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const totalValueAtRisk = APPROVAL_ROWS.reduce((sum, row) => sum + rowValueAtRisk(frame, row), 0);
  const activeApprovalCount = APPROVAL_ROWS.filter((row) => !isRevoked(frame, row)).length;

  return (
    <AbsoluteFill className="bg-black">
      <div
        className="flex items-center justify-between border-b border-zinc-800 px-12 py-7"
        style={riseIn(frame, fps, 3)}
      >
        <h2 className="text-4xl font-bold text-zinc-100">Approvals</h2>
        <ChainChip frame={frame} fps={fps} />
      </div>
      <div className="flex items-center gap-20 border-b border-zinc-800 px-12 py-7" style={riseIn(frame, fps, 8)}>
        <Stat label="Total Approvals">
          <span className="tabular-nums text-4xl font-semibold text-zinc-100">{activeApprovalCount}</span>
        </Stat>
        <Stat label="Total Value at Risk">
          <ValueAtRiskCounter frame={frame} fps={fps} totalValueAtRisk={totalValueAtRisk} />
        </Stat>
      </div>
      <div className="flex flex-1 flex-col divide-y divide-zinc-800">
        {APPROVAL_ROWS.map((row, index) => (
          <ApprovalRow key={row.symbol} frame={frame} fps={fps} row={row} index={index} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const isRevoked = (frame: number, row: HeroApprovalRow) => row.revokedAt !== undefined && frame >= row.revokedAt;

// The row's value at risk ticks down to zero once its revoke lands; the header counter derives
// from these row values, so the two always move in sync.
const rowValueAtRisk = (frame: number, row: HeroApprovalRow) => {
  if (row.revokedAt === undefined) return row.valueAtRisk;
  return interpolate(frame, [row.revokedAt, row.revokedAt + VALUE_TICK_DURATION_IN_FRAMES], [row.valueAtRisk, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

const formatUsd = (value: number) => `$${value.toFixed(2)}`;

const ChainChip = ({ frame, fps }: { frame: number; fps: number }) => {
  return (
    <div
      className="flex items-center gap-3 rounded-full border border-zinc-700 bg-zinc-900 px-5 py-2"
      style={popIn(frame, fps, 5)}
    >
      <Img src={staticFile('images/chains/ethereum.svg')} className="h-7 w-7 rounded-full" />
      <span className="text-xl text-zinc-300">Ethereum</span>
    </div>
  );
};

const Stat = ({ label, children }: { label: string; children: React.ReactNode }) => {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-lg font-medium text-zinc-400">{label}</span>
      {children}
    </div>
  );
};

// The hero's protagonist: the counter ticks down with each revoke, turns green when it reaches
// zero, and gets a Protected pill for the settled end state that doubles as the poster.
const ValueAtRiskCounter = ({
  frame,
  fps,
  totalValueAtRisk,
}: {
  frame: number;
  fps: number;
  totalValueAtRisk: number;
}) => {
  const reachedZero = totalValueAtRisk < 0.005;

  return (
    <div className="flex items-center gap-4">
      <span className={`tabular-nums text-4xl font-semibold ${reachedZero ? 'text-green-400' : 'text-zinc-100'}`}>
        {formatUsd(totalValueAtRisk)}
      </span>
      {frame >= PROTECTED_PILL_AT && (
        <div style={popIn(frame, fps, PROTECTED_PILL_AT)}>
          <Pill className="bg-green-900/40 px-4 py-1.5 text-xl text-green-400">✓ Protected</Pill>
        </div>
      )}
    </div>
  );
};

const ApprovalRow = ({
  frame,
  fps,
  row,
  index,
}: {
  frame: number;
  fps: number;
  row: HeroApprovalRow;
  index: number;
}) => {
  const rowValue = rowValueAtRisk(frame, row);

  return (
    <div
      className="flex flex-1 items-center gap-4 px-12"
      style={{
        ...riseIn(frame, fps, 14 + index * 6),
        backgroundColor: `rgba(239, 68, 68, ${0.13 * exploitedTintOpacity(frame, row)})`,
      }}
    >
      <div className="flex items-center gap-4" style={{ opacity: revokedRowContentOpacity(frame, row) }}>
        <TokenIcon symbol={row.symbol} size={44} />
        <span className="text-2xl font-medium text-zinc-100">{row.symbol}</span>
        <span className="text-2xl text-zinc-400">{row.spender}</span>
        {row.exploited && (
          <div style={popIn(frame, fps, EXPLOIT_FLAGGED_AT)}>
            <Pill className="bg-red-900/40 px-4 py-1 text-lg text-red-400">Exploited</Pill>
          </div>
        )}
      </div>
      <div className="ml-auto flex items-center gap-8">
        <span
          className={`tabular-nums text-2xl ${rowValue < 0.005 ? 'text-zinc-500' : 'text-zinc-100'}`}
          style={{ opacity: revokedRowContentOpacity(frame, row) }}
        >
          {formatUsd(rowValue)}
        </span>
        <RevokeActionCell frame={frame} fps={fps} row={row} />
      </div>
    </div>
  );
};

// A revoked row's content dims so the settled frame reads as two handled approvals among four
// that are still active; the action cell stays at full opacity so the green pill keeps its punch.
const revokedRowContentOpacity = (frame: number, row: HeroApprovalRow) => {
  if (row.revokedAt === undefined) return 1;
  return interpolate(frame, [row.revokedAt, row.revokedAt + ROW_DIM_DURATION_IN_FRAMES], [1, 0.45], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

// The exploited row's red tint fades in when the pill flags it and back out once the revoke has
// dealt with it, so the end state is calm rather than alarmed.
const exploitedTintOpacity = (frame: number, row: HeroApprovalRow) => {
  if (!row.exploited) return 0;
  const fadeIn = interpolate(frame, [EXPLOIT_FLAGGED_AT, EXPLOIT_FLAGGED_AT + 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (row.revokedAt === undefined) return fadeIn;
  const fadeOut = interpolate(frame, [row.revokedAt, row.revokedAt + 15], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return Math.min(fadeIn, fadeOut);
};

// The row's action: a Revoke button that gets pressed, then swaps to a green Revoked status pill.
// Both states render inside the same fixed footprint so the swap doesn't reflow the rows around it.
const RevokeActionCell = ({ frame, fps, row }: { frame: number; fps: number; row: HeroApprovalRow }) => {
  return (
    <div className="flex h-[52px] w-[132px] items-center justify-center">
      {isRevoked(frame, row) ? (
        <RevokedStatusPill frame={frame} fps={fps} revokedAt={row.revokedAt!} />
      ) : (
        <RevokeButton frame={frame} fps={fps} row={row} />
      )}
    </div>
  );
};

const RevokeButton = ({ frame, fps, row }: { frame: number; fps: number; row: HeroApprovalRow }) => {
  const clickPulse = row.revokePulseAt !== undefined ? pulseOnce(frame, fps, row.revokePulseAt) : undefined;

  return (
    <div className="rounded-lg border border-zinc-700 px-6 py-2 text-xl font-medium text-white" style={clickPulse}>
      Revoke
    </div>
  );
};

const RevokedStatusPill = ({ frame, fps, revokedAt }: { frame: number; fps: number; revokedAt: number }) => {
  const changePop = spring({ frame: frame - revokedAt, fps, durationInFrames: 15 });

  return (
    <div style={{ transform: `scale(${interpolate(changePop, [0, 1], [0.7, 1])})` }}>
      <Pill className="bg-green-900/40 px-5 py-1.5 text-xl text-green-400">Revoked</Pill>
    </div>
  );
};
