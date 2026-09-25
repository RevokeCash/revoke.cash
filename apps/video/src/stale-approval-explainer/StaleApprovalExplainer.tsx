import { linearTiming, TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { AbsoluteFill, Freeze, Html5Audio, interpolate, Sequence, staticFile } from 'remotion';
import { BeforeTheExploitScene } from './scenes/BeforeTheExploitScene';
import { CleanupComparisonScene } from './scenes/CleanupComparisonScene';
import { ExploitHookScene } from './scenes/ExploitHookScene';
import { SetItOnceScene } from './scenes/SetItOnceScene';
import { UltimateCtaScene } from './scenes/UltimateCtaScene';

const TRANSITION_FRAMES = 8;
const FIRST_FRAME_POSTER_FRAME = 200;
// The track is mastered to about -14 LUFS; -4.4 dB brings the video to about -18 LUFS.
const SOUNDTRACK_GAIN = 0.6;

// Explainer for Stale Approval Cleanup, told through the Magic Eden / Limit Break exploit of
// 25 September 2026: the exploit is only context, the timeline comparison carries the argument.
// Render with: yarn render StaleApprovalExplainer out/stale-approval-explainer.mp4
// The soundtrack's cue points follow these scene durations; after changing them, update
// scripts/stale-approval-soundtrack/arrangement.mjs and regenerate the audio.
export const STALE_APPROVAL_EXPLAINER_SCENES = [
  { id: 'StaleExploitHook', component: ExploitHookScene, durationInFrames: 115 },
  { id: 'StaleCleanupComparison', component: CleanupComparisonScene, durationInFrames: 210 },
  { id: 'StaleSetItOnce', component: SetItOnceScene, durationInFrames: 180 },
  { id: 'StaleBeforeTheExploit', component: BeforeTheExploitScene, durationInFrames: 125 },
  { id: 'StaleUltimateCta', component: UltimateCtaScene, durationInFrames: 115 },
] as const;

export const STALE_APPROVAL_EXPLAINER_DURATION_IN_FRAMES =
  STALE_APPROVAL_EXPLAINER_SCENES.reduce((total, scene) => total + scene.durationInFrames, 0) -
  (STALE_APPROVAL_EXPLAINER_SCENES.length - 1) * TRANSITION_FRAMES;

// The soundtrack opens on a single clock tick and ends on its own final chord, so this envelope only
// cuts off the last of the reverb tail.
const soundtrackVolume = (frame: number) =>
  interpolate(
    frame,
    [STALE_APPROVAL_EXPLAINER_DURATION_IN_FRAMES - 10, STALE_APPROVAL_EXPLAINER_DURATION_IN_FRAMES],
    [SOUNDTRACK_GAIN, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

export const StaleApprovalExplainer = () => {
  return (
    <AbsoluteFill className="bg-black">
      <TransitionSeries>
        {STALE_APPROVAL_EXPLAINER_SCENES.flatMap((scene, index) => [
          ...(index > 0
            ? [
                <TransitionSeries.Transition
                  key={`transition-${scene.id}`}
                  presentation={fade()}
                  timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
                />,
              ]
            : []),
          <TransitionSeries.Sequence key={`scene-${scene.id}`} durationInFrames={scene.durationInFrames}>
            <scene.component />
          </TransitionSeries.Sequence>,
        ])}
      </TransitionSeries>
      {/* Social platforms commonly sample frame 0 for their thumbnail instead of using poster
          metadata. Show the settled timeline comparison for that single frame. */}
      <Sequence durationInFrames={1}>
        <Freeze frame={FIRST_FRAME_POSTER_FRAME}>
          <CleanupComparisonScene />
        </Freeze>
      </Sequence>
      <Html5Audio src={staticFile('audio/stale-approval-explainer.m4a')} volume={soundtrackVolume} />
    </AbsoluteFill>
  );
};
