import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { AbsoluteFill, Freeze, Html5Audio, interpolate, Sequence, staticFile } from 'remotion';
import { AutoRevokeScene } from './scenes/AutoRevokeScene';
import { CtaScene } from './scenes/CtaScene';
import { HookScene } from './scenes/HookScene';
import { PremiumScene } from './scenes/PremiumScene';
import { PricingScene } from './scenes/PricingScene';
import { ProblemScene } from './scenes/ProblemScene';
import { TitleCardScene } from './scenes/TitleCardScene';

const TRANSITION_FRAMES = 8;
const FIRST_FRAME_POSTER_FRAME = 90;
const SOUNDTRACK_GAIN = 0.335; // -9.5 dB

// Cold-open on the hook; the brand reveal lands as the payoff after the problem beat.
export const MAIN_SCENES = [
  { component: HookScene, durationInFrames: 114 },
  { component: ProblemScene, durationInFrames: 167 },
  { component: TitleCardScene, durationInFrames: 114 },
  { component: PremiumScene, durationInFrames: 113 },
  { component: AutoRevokeScene, durationInFrames: 326 },
  { component: PricingScene, durationInFrames: 167 },
  { component: CtaScene, durationInFrames: 159 },
] as const;

export const MAIN_DURATION_IN_FRAMES =
  MAIN_SCENES.reduce((total, scene) => total + scene.durationInFrames, 0) -
  (MAIN_SCENES.length - 1) * TRANSITION_FRAMES;

// The selected soundtrack excerpt is timed to the scene structure; the envelope here only handles
// the master fade-in/out.
const soundtrackVolume = (frame: number) =>
  interpolate(
    frame,
    [0, 20, MAIN_DURATION_IN_FRAMES - 60, MAIN_DURATION_IN_FRAMES],
    [0, SOUNDTRACK_GAIN, SOUNDTRACK_GAIN, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    },
  );

// A type alias rather than an interface: Remotion's Composition props must satisfy
// Record<string, unknown>, which interfaces do not (no implicit index signature).
export type MainProps = {
  soundtrack: string;
  soundtrackTrimBefore?: number;
};

export const Main = ({ soundtrack, soundtrackTrimBefore = 0 }: MainProps) => {
  return (
    <AbsoluteFill className="bg-black">
      <TransitionSeries>
        {MAIN_SCENES.flatMap((scene, index) => [
          ...(index > 0
            ? [
                <TransitionSeries.Transition
                  key={`transition-${scene.component.name}`}
                  presentation={fade()}
                  timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
                />,
              ]
            : []),
          <TransitionSeries.Sequence key={`scene-${scene.component.name}`} durationInFrames={scene.durationInFrames}>
            <scene.component />
          </TransitionSeries.Sequence>,
        ])}
      </TransitionSeries>
      {/* Social platforms commonly sample frame 0 for their thumbnail instead of using poster
          metadata. Show the settled title card for that single frame without shifting the video or audio. */}
      <Sequence durationInFrames={1}>
        <Freeze frame={FIRST_FRAME_POSTER_FRAME}>
          <TitleCardScene />
        </Freeze>
      </Sequence>
      <Html5Audio src={staticFile(soundtrack)} trimBefore={soundtrackTrimBefore} volume={soundtrackVolume} />
    </AbsoluteFill>
  );
};
