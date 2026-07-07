import { Composition, Folder } from 'remotion';
import { MAIN_DURATION_IN_FRAMES, Main } from './premium-announcement/Main';
import { AutoRevokeScene } from './premium-announcement/scenes/AutoRevokeScene';
import { CtaScene } from './premium-announcement/scenes/CtaScene';
import { HookScene } from './premium-announcement/scenes/HookScene';
import { PremiumScene } from './premium-announcement/scenes/PremiumScene';
import { PricingScene } from './premium-announcement/scenes/PricingScene';
import { ProblemScene } from './premium-announcement/scenes/ProblemScene';
import { TitleCardScene } from './premium-announcement/scenes/TitleCardScene';
import { AutoRevokeShowcaseStill } from './premium-showcase/AutoRevokeShowcaseStill';
import { BatchRevokeStill } from './premium-showcase/BatchRevokeStill';
import { ExploitCheckerStill } from './premium-showcase/ExploitCheckerStill';
import { MultichainDashboardStill } from './premium-showcase/MultichainDashboardStill';
import { TimeMachineStill } from './premium-showcase/TimeMachineStill';
import './fonts';
import './style.css';

const FPS = 30;

// The announcement video's individual scenes stay registered for stills and per-scene iteration.
const ANNOUNCEMENT_SCENES = [
  { id: 'Hook', component: HookScene, durationInFrames: 120 },
  { id: 'Problem', component: ProblemScene, durationInFrames: 150 },
  { id: 'TitleCard', component: TitleCardScene, durationInFrames: 100 },
  { id: 'Premium', component: PremiumScene, durationInFrames: 270 },
  { id: 'AutoRevoke', component: AutoRevokeScene, durationInFrames: 330 },
  { id: 'Pricing', component: PricingScene, durationInFrames: 210 },
  { id: 'Cta', component: CtaScene, durationInFrames: 140 },
] as const;

// Still images for the premium pricing page's feature showcase.
const SHOWCASE_STILLS = [
  { id: 'AutoRevokeShowcase', component: AutoRevokeShowcaseStill },
  { id: 'MultichainDashboardShowcase', component: MultichainDashboardStill },
  { id: 'ExploitCheckerShowcase', component: ExploitCheckerStill },
  { id: 'BatchRevokeShowcase', component: BatchRevokeStill },
  { id: 'TimeMachineShowcase', component: TimeMachineStill },
] as const;

export const Root = () => {
  return (
    <>
      <Folder name="premium-announcement">
        <Composition
          id="Main"
          component={Main}
          durationInFrames={MAIN_DURATION_IN_FRAMES}
          fps={FPS}
          width={1920}
          height={1080}
          defaultProps={{ soundtrack: 'audio/soundtrack.m4a' }}
        />
        <Composition
          id="MainAlternativeSoundtrack"
          component={Main}
          durationInFrames={MAIN_DURATION_IN_FRAMES}
          fps={FPS}
          width={1920}
          height={1080}
          defaultProps={{ soundtrack: 'audio/soundtrack-alternative.m4a' }}
        />
        {ANNOUNCEMENT_SCENES.map((scene) => (
          <Composition
            key={scene.id}
            id={scene.id}
            component={scene.component}
            durationInFrames={scene.durationInFrames}
            fps={FPS}
            width={1920}
            height={1080}
          />
        ))}
      </Folder>
      <Folder name="premium-showcase">
        {SHOWCASE_STILLS.map((still) => (
          <Composition
            key={still.id}
            id={still.id}
            component={still.component}
            durationInFrames={1}
            fps={FPS}
            width={1200}
            height={630}
          />
        ))}
      </Folder>
    </>
  );
};
