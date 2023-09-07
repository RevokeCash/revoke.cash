import { CircularProgressbarWithChildren } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import Loader from 'components/common/Loader';

interface Props {
  score: number;
  isLoading: boolean;
  error?: Error;
}

const WalletHealthScore = ({ score, error, isLoading }: Props) => {
  if (error) return null;

  const color =
    score > 50
      ? interpolateColor('#ffef20', '#20FF20', (score - 50) / 50)
      : interpolateColor('#FF2020', '#ffef20', score / 50);

  return (
    <Loader isLoading={isLoading} className="rounded-full">
      <CircularProgressbarWithChildren
        value={score}
        styles={{ path: { stroke: color }, trail: { stroke: 'transparent' } }}
        className="h-16 rounded-full bg-zinc-300 dark:bg-zinc-700"
        circleRatio={1}
        strokeWidth={10}
      >
        <div className="text-lg font-bold">{score}</div>
      </CircularProgressbarWithChildren>
    </Loader>
  );
};

// https://stackoverflow.com/a/76126221/4207548
const interpolateColor = (color1: string, color2: string, percent: number) => {
  // Convert the hex colors to RGB values
  const r1 = parseInt(color1.substring(1, 3), 16);
  const g1 = parseInt(color1.substring(3, 5), 16);
  const b1 = parseInt(color1.substring(5, 7), 16);

  const r2 = parseInt(color2.substring(1, 3), 16);
  const g2 = parseInt(color2.substring(3, 5), 16);
  const b2 = parseInt(color2.substring(5, 7), 16);

  // Interpolate the RGB values
  const r = Math.round(r1 + (r2 - r1) * percent);
  const g = Math.round(g1 + (g2 - g1) * percent);
  const b = Math.round(b1 + (b2 - b1) * percent);

  // Convert the interpolated RGB values back to a hex color
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export default WalletHealthScore;
