import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { bodyFontFamily, headingFontFamily } from '../fonts';

export const TitleCardScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wordmarkEntrance = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 30 });
  const taglineEntrance = spring({ frame: frame - 20, fps, config: { damping: 200 }, durationInFrames: 30 });
  const subtitleEntrance = spring({ frame: frame - 35, fps, config: { damping: 200 }, durationInFrames: 30 });
  const underlineSweep = spring({ frame: frame - 30, fps, config: { damping: 200 }, durationInFrames: 40 });
  const sceneFadeOut = interpolate(frame, [130, 150], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill className="items-center justify-center bg-black" style={{ opacity: sceneFadeOut }}>
      <div className="flex flex-col items-center gap-12">
        <Img
          src={staticFile('images/revoke-wordmark-orange.svg')}
          alt="Revoke.cash"
          className="w-[560px]"
          style={{
            opacity: wordmarkEntrance,
            transform: `translateY(${interpolate(wordmarkEntrance, [0, 1], [40, 0])}px)`,
          }}
        />
        <div className="flex flex-col items-center gap-6">
          <h1
            className="text-8xl font-semibold tracking-tight text-white"
            style={{
              fontFamily: headingFontFamily,
              opacity: taglineEntrance,
              transform: `translateY(${interpolate(taglineEntrance, [0, 1], [40, 0])}px)`,
            }}
          >
            Introducing Premium & Ultimate
          </h1>
          <div
            className="h-2 w-full origin-left rounded-full bg-brand"
            style={{ transform: `scaleX(${underlineSweep})` }}
          />
        </div>
        <p
          className="text-5xl text-zinc-400"
          style={{
            fontFamily: bodyFontFamily,
            opacity: subtitleEntrance,
            transform: `translateY(${interpolate(subtitleEntrance, [0, 1], [40, 0])}px)`,
          }}
        >
          Set-and-forget protection for your wallet
        </p>
      </div>
    </AbsoluteFill>
  );
};
