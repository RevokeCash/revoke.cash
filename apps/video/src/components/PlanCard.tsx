import { twMerge } from 'tailwind-merge';
import { Pill } from './Pill';

interface Props {
  name: string;
  price: string;
  note?: string;
  tagline: string;
  badge?: { label: string; className: string };
  className?: string;
  style?: React.CSSProperties;
}

// Video-simplified tier card: plan name, price, and a one-line differentiator. The full feature
// matrix lives on the pricing page; at social-feed sizes only the price and tagline are readable.
export const PlanCard = ({ name, price, note, tagline, badge, className, style }: Props) => {
  return (
    <div
      className={twMerge(
        'relative flex w-[420px] flex-col gap-4 rounded-xl border border-zinc-700 bg-black p-8',
        className,
      )}
      style={style}
    >
      {badge && (
        <Pill className={twMerge('absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 text-base', badge.className)}>
          {badge.label}
        </Pill>
      )}
      <h2 className="text-2xl font-semibold text-zinc-100">{name}</h2>
      <div className="flex items-baseline gap-x-3">
        <span className="font-heading text-7xl font-semibold text-zinc-100">{price}</span>
        {note && <span className="text-lg text-zinc-400">{note}</span>}
      </div>
      <p className="text-2xl text-zinc-300">{tagline}</p>
    </div>
  );
};
