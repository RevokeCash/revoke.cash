import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { popIn, riseIn } from '../motion';

export const CtaScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill className="items-center justify-center bg-brand">
      <div className="flex flex-col items-center gap-16">
        <Img
          src={staticFile('images/revoke-wordmark-black.svg')}
          alt="Revoke.cash"
          className="w-[560px]"
          style={riseIn(frame, fps, 0)}
        />
        <h1 className="font-heading text-8xl font-semibold tracking-tight text-zinc-900" style={riseIn(frame, fps, 10)}>
          Protect your wallet today
        </h1>
        <div className="flex flex-col items-center gap-6">
          <div
            className="rounded-full bg-black px-12 py-5 font-heading text-5xl font-semibold text-white"
            style={popIn(frame, fps, 22)}
          >
            revoke.cash/premium
          </div>
          <p className="text-3xl font-medium text-zinc-800" style={riseIn(frame, fps, 35)}>
            Plans from $99/yr · Free tier stays free
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
