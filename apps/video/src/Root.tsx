import { Composition } from 'remotion';
import { MAIN_DURATION_IN_FRAMES, Main } from './Main';
import { AutoRevokeScene } from './scenes/AutoRevokeScene';
import { CtaScene } from './scenes/CtaScene';
import { HookScene } from './scenes/HookScene';
import { PremiumScene } from './scenes/PremiumScene';
import { PricingScene } from './scenes/PricingScene';
import { ProblemScene } from './scenes/ProblemScene';
import { TitleCardScene } from './scenes/TitleCardScene';
import './fonts';
import './style.css';

const FPS = 30;

// Individual scenes stay registered for stills and per-scene iteration in Studio.
const SCENES = [
  { id: 'Hook', component: HookScene, durationInFrames: 120 },
  { id: 'Problem', component: ProblemScene, durationInFrames: 150 },
  { id: 'TitleCard', component: TitleCardScene, durationInFrames: 100 },
  { id: 'Premium', component: PremiumScene, durationInFrames: 270 },
  { id: 'AutoRevoke', component: AutoRevokeScene, durationInFrames: 330 },
  { id: 'Pricing', component: PricingScene, durationInFrames: 210 },
  { id: 'Cta', component: CtaScene, durationInFrames: 140 },
] as const;

export const Root = () => {
  return (
    <>
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
      {SCENES.map((scene) => (
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
    </>
  );
};
