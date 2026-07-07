import { Pill } from './Pill';

export type ActivityStatus = 'revoked' | 'submitting' | 'pending';

const STATUS_STYLES: Record<ActivityStatus, { label: string; className: string }> = {
  revoked: { label: 'Revoked', className: 'bg-green-400' },
  submitting: { label: 'Submitting', className: 'bg-blue-300' },
  pending: { label: 'Pending', className: 'bg-yellow-300' },
};

// Replica of apps/web/components/account/auto-revoke/activity/AutoRevokeActivityStatusBadge.tsx.
// Fixed width (sized to the widest label, "Submitting") so status changes never shift the layout.
export const StatusPill = ({ status }: { status: ActivityStatus }) => {
  const style = STATUS_STYLES[status];
  return <Pill className={`w-20 py-0.75 text-zinc-900 ${style.className}`}>{style.label}</Pill>;
};
