import { twMerge } from 'tailwind-merge';
import type { MockApproval } from '../data/mock-data';
import { riseIn } from '../motion';
import { Pill } from './Pill';
import { TokenIcon } from './TokenIcon';

const TABLE_GRID = 'grid grid-cols-[200px_190px_330px_160px_140px] items-center gap-4';
const ROW_HEIGHT = 56;

interface RowMotion {
  frame: number;
  fps: number;
  startAt: number;
  stagger: number;
}

interface Props {
  approvals: MockApproval[];
  className?: string;
  // When provided, rows cascade in one after another.
  rowMotion?: RowMotion;
  // Fades the exploited row's red tint and pill in (Problem scene) or out (time-machine scrub).
  exploitedHighlightOpacity?: number;
  // 1 = the approval exists, 0 = fully collapsed; drives the time-machine scrub in the Premium
  // scene, where approvals disappear as the date moves back past their creation.
  rowPresence?: (approval: MockApproval) => number;
}

// Replica of the approvals dashboard table (apps/web/components/allowances/dashboard),
// matching the real column order: Asset · Approved Amount · Approved Spender · Last Updated · Actions
export const ApprovalsTable = ({
  approvals,
  className,
  rowMotion,
  exploitedHighlightOpacity = 1,
  rowPresence,
}: Props) => {
  return (
    <div className={twMerge('overflow-hidden rounded-xl border border-zinc-800 bg-black', className)}>
      <div className={twMerge(TABLE_GRID, 'border-b border-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-400')}>
        <div>Asset</div>
        <div>Approved Amount</div>
        <div>Approved Spender</div>
        <div>Last Updated</div>
        <div className="text-center">Actions</div>
      </div>
      {approvals.map((approval, index) => (
        <ApprovalRow
          key={`${approval.symbol}-${approval.spender}`}
          approval={approval}
          exploitedHighlightOpacity={exploitedHighlightOpacity}
          presence={rowPresence?.(approval) ?? 1}
          entranceStyle={
            rowMotion
              ? riseIn(rowMotion.frame, rowMotion.fps, rowMotion.startAt + index * rowMotion.stagger)
              : undefined
          }
        />
      ))}
    </div>
  );
};

interface RowProps {
  approval: MockApproval;
  exploitedHighlightOpacity: number;
  presence: number;
  entranceStyle?: React.CSSProperties;
}

const ApprovalRow = ({ approval, exploitedHighlightOpacity, presence, entranceStyle }: RowProps) => {
  return (
    <div
      className={twMerge(TABLE_GRID, 'overflow-hidden border-b border-zinc-800 px-4 text-sm last:border-b-0')}
      style={{
        ...entranceStyle,
        height: ROW_HEIGHT * presence,
        opacity: Math.min(presence, (entranceStyle?.opacity as number) ?? 1),
        borderBottomWidth: presence < 0.05 ? 0 : undefined,
        backgroundColor: approval.exploited ? `rgba(239, 68, 68, ${0.15 * exploitedHighlightOpacity})` : undefined,
      }}
    >
      <div className="flex items-center gap-2 font-medium text-zinc-100">
        <TokenIcon symbol={approval.symbol} />
        {approval.symbol}
      </div>
      <div className="text-zinc-400">{approval.amount}</div>
      <div className="flex items-center gap-2 text-zinc-100">
        {approval.spender}
        {approval.exploited && (
          <div style={{ opacity: exploitedHighlightOpacity }}>
            <Pill className="bg-red-400 text-zinc-900">Exploited</Pill>
          </div>
        )}
      </div>
      <div className="text-zinc-400">{approval.lastUpdated}</div>
      <div className="flex items-center justify-center rounded-lg border border-white py-1.5 font-medium text-white">
        Revoke
      </div>
    </div>
  );
};
