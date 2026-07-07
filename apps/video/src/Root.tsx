import { Composition } from 'remotion';
import { TitleCardScene } from './scenes/TitleCardScene';
import './fonts';
import './style.css';

const FPS = 30;
const SECOND = FPS;

export const Root = () => {
  return (
    <Composition
      id="TitleCard"
      component={TitleCardScene}
      durationInFrames={5 * SECOND}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
