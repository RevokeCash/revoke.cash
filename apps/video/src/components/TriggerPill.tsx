import { Pill } from './Pill';

export type ActivityTrigger = 'exploit' | 'risky' | 'stale';

// Colors follow the real trigger badge mapping (AutoRevokeActivityTriggerBadge.tsx): exploit is
// danger, risky is warning (shared with Pending) and stale is neutral, in StatusLabel dark variants.
const TRIGGER_STYLES: Record<ActivityTrigger, { label: string; className: string }> = {
  exploit: { label: 'Exploit', className: 'bg-red-900/40 text-red-400' },
  risky: { label: 'Risky', className: 'bg-yellow-900/40 text-yellow-400' },
  stale: { label: 'Stale', className: 'bg-zinc-800 text-zinc-400' },
};

export const TriggerPill = ({ trigger }: { trigger: ActivityTrigger }) => {
  const style = TRIGGER_STYLES[trigger];
  return <Pill className={`min-w-18 py-0.75 ${style.className}`}>{style.label}</Pill>;
};
