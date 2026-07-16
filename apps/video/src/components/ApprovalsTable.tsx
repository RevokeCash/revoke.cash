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
  // Controls the exploited row's red tint and pill while it animates into view.
  exploitedHighlightOpacity?: number;
}

// Replica of the approvals dashboard table (apps/web/components/allowances/dashboard),
// matching the real column order: Asset · Approved Amount · Approved Spender · Last Updated · Actions
export const ApprovalsTable = ({ approvals, className, rowMotion, exploitedHighlightOpacity = 1 }: Props) => {
  return (
    <div className={twMerge('overflow-hidden rounded-xl border border-zinc-800 bg-black', className)}>
      <div className={twMerge(TABLE_GRID, 'border-b border-zinc-800 px-4 py-3 text-sm font-bold text-zinc-100')}>
        <div>Asset</div>
        <div>Approved Amount</div>
        <div>Approved Spender</div>
        <div>Last Updated</div>
        <div className="text-right">Actions</div>
      </div>
      {approvals.map((approval, index) => (
        <ApprovalRow
          key={`${approval.symbol}-${approval.spender}`}
          approval={approval}
          exploitedHighlightOpacity={exploitedHighlightOpacity}
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
  entranceStyle?: React.CSSProperties;
}

const ApprovalRow = ({ approval, exploitedHighlightOpacity, entranceStyle }: RowProps) => {
  return (
    <div
      className={twMerge(TABLE_GRID, 'overflow-hidden border-b border-zinc-800 px-4 text-sm last:border-b-0')}
      style={{
        ...entranceStyle,
        height: ROW_HEIGHT,
        backgroundColor: approval.exploited ? `rgba(239, 68, 68, ${0.15 * exploitedHighlightOpacity})` : undefined,
      }}
    >
      <div className="flex items-center gap-2 font-medium text-zinc-100">
        <TokenIcon symbol={approval.symbol} />
        {approval.symbol}
      </div>
      <div className="text-zinc-100">{approval.amount}</div>
      <div className="flex items-center gap-2 text-zinc-100">
        {approval.spender}
        {approval.exploited && (
          <div style={{ opacity: exploitedHighlightOpacity }}>
            <Pill className="bg-red-900/40 text-red-400">Exploited</Pill>
          </div>
        )}
      </div>
      <div className="text-zinc-100">{approval.lastUpdated}</div>
      <div className="flex justify-end">
        <div className="rounded-lg border border-zinc-700 px-4 py-1.5 font-medium text-white">Revoke</div>
      </div>
    </div>
  );
};
