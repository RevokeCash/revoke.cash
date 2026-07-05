import {
  AcademicCapIcon,
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  BoltIcon,
  CubeTransparentIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  PuzzlePieceIcon,
  RocketLaunchIcon,
  SparklesIcon,
  StarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import FadeIn from 'components/common/FadeIn';
import { useTranslations } from 'next-intl';
import type React from 'react';
import { twMerge } from 'tailwind-merge';

const MILESTONES = [
  { date: 'Oct 2019', year: 2019, key: 'created', icon: RocketLaunchIcon, highlighted: true },
  { date: 'Jul 2021', year: 2021, key: 'nft_support', icon: SparklesIcon },
  { date: 'Jun 2022', year: 2022, key: 'multichain', icon: GlobeAltIcon },
  { date: 'Aug 2022', year: 2022, key: 'extension', icon: PuzzlePieceIcon },
  { date: 'Sep 2022', year: 2022, key: 'full_time', icon: StarIcon, highlighted: true },
  { date: 'Jan 2023', year: 2023, key: 'redesign', icon: PaintBrushIcon },
  { date: 'May 2023', year: 2023, key: 'learn_section', icon: AcademicCapIcon },
  { date: 'Jan 2024', year: 2024, key: 'team_retropgf', icon: UserGroupIcon },
  { date: 'Oct 2024', year: 2024, key: 'batch_revoke', icon: BoltIcon },
  { date: 'May 2025', year: 2025, key: 'single_tx_batch', icon: CubeTransparentIcon },
  { date: 'Sep 2025', year: 2025, key: 'beyond_approvals', icon: ArrowsPointingOutIcon },
  { date: 'Mar 2026', year: 2026, key: 'extension_overhaul', icon: ArrowPathIcon },
  { date: 'Jul 2026', year: 2026, key: 'premium', icon: CurrencyDollarIcon, highlighted: true },
] as const;

const Timeline = () => {
  const t = useTranslations();

  return (
    <div className="relative">
      <TimelineLine />
      <div className="flex flex-col gap-4">
        {MILESTONES.map((milestone, index) => {
          const showYear = index === 0 || milestone.year !== MILESTONES[index - 1].year;
          const side = index % 2 === 0 ? 'left' : 'right';
          const highlighted = 'highlighted' in milestone;

          return (
            <FadeIn key={milestone.key}>
              {showYear && <YearMarker label={milestone.year} />}
              <TimelineCard
                date={milestone.date}
                title={t(`about.timeline.${milestone.key}.title`)}
                description={t(`about.timeline.${milestone.key}.description`)}
                icon={milestone.icon}
                side={side}
                highlighted={highlighted}
              />
            </FadeIn>
          );
        })}

        <YearMarker label="Today" />
      </div>
    </div>
  );
};

export default Timeline;

const YearMarker = ({ label }: { label?: string | number }) => {
  return (
    <div className="relative flex sm:justify-center mb-4">
      <div className="relative z-10 -translate-x-1/2 left-[20px] sm:left-auto sm:translate-x-0 rounded-full bg-brand px-3 py-0.5 text-xs font-bold text-black">
        {label}
      </div>
    </div>
  );
};

const TimelineLine = () => {
  const sharedClassName = 'absolute top-6 bottom-10 w-px border-l border-dashed border-zinc-300 dark:border-zinc-700';

  return (
    <>
      <div className={twMerge(sharedClassName, 'hidden sm:block left-1/2')} />
      <div className={twMerge(sharedClassName, 'sm:hidden left-[20px]')} />
    </>
  );
};

interface TimelineCardProps {
  date: string;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  side: 'left' | 'right';
  highlighted?: boolean;
}

const TimelineCard = ({ date, title, description, icon: Icon, side, highlighted }: TimelineCardProps) => {
  const cardClassName = twMerge(
    'rounded-xl border p-4 sm:max-w-sm sm:w-full',
    highlighted ? 'border-brand/30 bg-brand/5' : 'border-zinc-200 dark:border-zinc-800',
    side === 'left'
      ? 'sm:col-start-1 sm:row-start-1 sm:justify-self-end sm:text-right'
      : 'sm:col-start-3 sm:row-start-1',
  );

  const iconClassName = twMerge(
    'relative z-10 mt-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
    highlighted
      ? 'border-brand/30 bg-orange-50 dark:bg-zinc-900'
      : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950',
  );

  return (
    <div className="grid grid-cols-[40px_1fr] sm:grid-cols-[1fr_40px_1fr] gap-4 items-start">
      <div className="flex justify-center sm:col-start-2 sm:row-start-1">
        <div className={iconClassName}>
          <Icon className="h-5 w-5 text-brand" />
        </div>
      </div>

      <div className={cardClassName}>
        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{date}</span>
        <h3 className="text-sm font-semibold mt-1">{title}</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{description}</p>
      </div>
    </div>
  );
};
