import { Pill } from './Pill';

export type ActivityStatus = 'revoked' | 'submitting' | 'pending';

// Colors follow the real StatusLabel dark-mode variants (apps/web/components/common/StatusLabel.tsx):
// success, info and warning respectively.
const STATUS_STYLES: Record<ActivityStatus, { label: string; className: string }> = {
  revoked: { label: 'Revoked', className: 'bg-green-900/40 text-green-400' },
  submitting: { label: 'Submitting', className: 'bg-blue-900/40 text-blue-400' },
  pending: { label: 'Pending', className: 'bg-yellow-900/40 text-yellow-400' },
};

// Replica of apps/web/components/account/auto-revoke/activity/AutoRevokeActivityStatusBadge.tsx.
// Fixed width (sized to the widest label, "Submitting") so status changes never shift the layout.
export const StatusPill = ({ status }: { status: ActivityStatus }) => {
  const style = STATUS_STYLES[status];
  return <Pill className={`w-20 py-0.75 ${style.className}`}>{style.label}</Pill>;
};
