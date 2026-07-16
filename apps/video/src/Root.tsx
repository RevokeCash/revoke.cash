import { Composition, Folder } from 'remotion';
import { ApprovalDashboardShowcase } from './landing-showcase/ApprovalDashboardShowcase';
import { HeroShowcase } from './landing-showcase/HeroShowcase';
import { SingleExploitCheckerShowcase } from './landing-showcase/SingleExploitCheckerShowcase';
import { MAIN_DURATION_IN_FRAMES, Main } from './premium-announcement/Main';
import { AutoRevokeScene } from './premium-announcement/scenes/AutoRevokeScene';
import { CtaScene } from './premium-announcement/scenes/CtaScene';
import { HookScene } from './premium-announcement/scenes/HookScene';
import { PremiumScene } from './premium-announcement/scenes/PremiumScene';
import { PricingScene } from './premium-announcement/scenes/PricingScene';
import { ProblemScene } from './premium-announcement/scenes/ProblemScene';
import { TitleCardScene } from './premium-announcement/scenes/TitleCardScene';
import { AutoRevokeShowcase } from './premium-showcase/AutoRevokeShowcase';
import { BatchRevokeShowcase } from './premium-showcase/BatchRevokeShowcase';
import { ExploitCheckerShowcase } from './premium-showcase/ExploitCheckerShowcase';
import { MultichainDashboardShowcase } from './premium-showcase/MultichainDashboardShowcase';
import { TimeMachineShowcase } from './premium-showcase/TimeMachineShowcase';
import './fonts';
import './style.css';

const FPS = 30;

// The announcement video's individual scenes stay registered for stills and per-scene iteration.
const ANNOUNCEMENT_SCENES = [
  { id: 'Hook', component: HookScene, durationInFrames: 114 },
  { id: 'Problem', component: ProblemScene, durationInFrames: 167 },
  { id: 'TitleCard', component: TitleCardScene, durationInFrames: 114 },
  { id: 'Premium', component: PremiumScene, durationInFrames: 113 },
  { id: 'AutoRevoke', component: AutoRevokeScene, durationInFrames: 326 },
  { id: 'Pricing', component: PricingScene, durationInFrames: 167 },
  { id: 'Cta', component: CtaScene, durationInFrames: 159 },
] as const;

// Animated mockups for the premium pricing page's feature showcase; the pricing page plays them
// as looping videos, and representative frames double as their poster images.
const SHOWCASE_ANIMATIONS = [
  { id: 'AutoRevokeShowcase', component: AutoRevokeShowcase, durationInFrames: 240 },
  { id: 'MultichainDashboardShowcase', component: MultichainDashboardShowcase, durationInFrames: 180 },
  { id: 'ExploitCheckerShowcase', component: ExploitCheckerShowcase, durationInFrames: 240 },
  { id: 'BatchRevokeShowcase', component: BatchRevokeShowcase, durationInFrames: 210 },
  { id: 'TimeMachineShowcase', component: TimeMachineShowcase, durationInFrames: 240 },
] as const;

// Animated mockups for the landing page's feature showcase, in the same style; the landing page's
// auto-revoke card reuses the AutoRevokeShowcase render from the premium set.
const LANDING_SHOWCASE_ANIMATIONS = [
  { id: 'ApprovalDashboardShowcase', component: ApprovalDashboardShowcase, durationInFrames: 210 },
  { id: 'SingleExploitCheckerShowcase', component: SingleExploitCheckerShowcase, durationInFrames: 240 },
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
          defaultProps={{ soundtrack: 'audio/revoke-premium-manual-cut.wav' }}
        />
        <Composition
          id="MainAlternativeSoundtrack"
          component={Main}
          durationInFrames={MAIN_DURATION_IN_FRAMES}
          fps={FPS}
          width={1920}
          height={1080}
          defaultProps={{ soundtrack: 'audio/soundtrack-alternative.m4a', soundtrackTrimBefore: 0 }}
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
        {SHOWCASE_ANIMATIONS.map((showcase) => (
          <Composition
            key={showcase.id}
            id={showcase.id}
            component={showcase.component}
            durationInFrames={showcase.durationInFrames}
            fps={FPS}
            width={1200}
            height={630}
          />
        ))}
      </Folder>
      <Folder name="landing-showcase">
        {LANDING_SHOWCASE_ANIMATIONS.map((showcase) => (
          <Composition
            key={showcase.id}
            id={showcase.id}
            component={showcase.component}
            durationInFrames={showcase.durationInFrames}
            fps={FPS}
            width={1200}
            height={630}
          />
        ))}
        {/* The hero animation renders at 4:3 instead of the showcase 1200x630, because it fills
            the hero's tall media column instead of the feature cards' wide media half. */}
        <Composition
          id="HeroShowcase"
          component={HeroShowcase}
          durationInFrames={280}
          fps={FPS}
          width={1200}
          height={900}
        />
      </Folder>
    </>
  );
};
