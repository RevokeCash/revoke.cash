import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ApprovalsTable } from '../../components/ApprovalsTable';
import { MOCK_APPROVALS, MOCK_CHAIN_LOGOS } from '../../data/mock-data';
import { popIn, riseIn } from '../../motion';

// The multichain dashboard assembles into one view for Premium customers.
export const PremiumScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill className="items-center justify-center gap-16 bg-black">
      <div className="flex h-[150px] w-[1500px] flex-col items-center gap-6 text-center">
        <h1 className="font-heading text-8xl font-semibold tracking-tight text-white" style={riseIn(frame, fps, 0)}>
          All your chains. <span className="text-brand">One dashboard.</span>
        </h1>
        <p className="text-4xl text-zinc-400" style={riseIn(frame, fps, 10)}>
          Premium — $99/yr · 10 wallets · 100+ networks
        </p>
      </div>
      <div className="flex items-center gap-8">
        {MOCK_CHAIN_LOGOS.map((logo, index) => (
          <Img
            key={logo}
            src={staticFile(logo)}
            className="h-20 w-20 rounded-full"
            style={popIn(frame, fps, 20 + index * 4)}
          />
        ))}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800 text-2xl font-semibold text-zinc-300"
          style={popIn(frame, fps, 20 + MOCK_CHAIN_LOGOS.length * 4)}
        >
          +100
        </div>
      </div>
      <div className="flex flex-col items-stretch" style={{ transform: 'scale(1.3)', transformOrigin: 'center' }}>
        <div style={riseIn(frame, fps, 45)}>
          <ApprovalsTable approvals={MOCK_APPROVALS.slice(0, 3)} rowMotion={{ frame, fps, startAt: 50, stagger: 6 }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
