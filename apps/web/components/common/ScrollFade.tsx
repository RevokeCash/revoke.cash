import { twMerge } from 'tailwind-merge';

interface Props {
  side: 'left' | 'right';
  visible: boolean;
  className?: string;
}

const ScrollFade = ({ side, visible, className }: Props) => (
  <div
    className={twMerge(
      'absolute inset-y-0 w-8 pointer-events-none transition-opacity duration-150',
      'from-white dark:from-black to-transparent',
      side === 'left' ? 'left-0 bg-linear-to-r' : 'right-0 bg-linear-to-l',
      visible ? 'opacity-100' : 'opacity-0',
      className,
    )}
  />
);

export default ScrollFade;
