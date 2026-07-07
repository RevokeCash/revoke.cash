import { Pill } from './Pill';

export type ActivityTrigger = 'exploit' | 'risky' | 'stale';

const TRIGGER_STYLES: Record<ActivityTrigger, { label: string; className: string }> = {
  exploit: { label: 'Exploit', className: 'bg-red-400 text-zinc-900' },
  risky: { label: 'Risky', className: 'bg-orange-300 text-zinc-900' },
  stale: { label: 'Stale', className: 'bg-zinc-300 text-zinc-900' },
};

export const TriggerPill = ({ trigger }: { trigger: ActivityTrigger }) => {
  const style = TRIGGER_STYLES[trigger];
  return <Pill className={`min-w-18 py-0.75 ${style.className}`}>{style.label}</Pill>;
};
