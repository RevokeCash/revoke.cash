import type { AdminAuditEvent } from '@revoke.cash/core/admin/audit';

const TABLE_COLUMN_COUNT = 7;

interface Props {
  item: AdminAuditEvent;
}

const AuditDetailsRow = ({ item }: Props) => (
  <tr className="border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
    <td colSpan={TABLE_COLUMN_COUNT} className="px-2 py-3">
      <div className="flex flex-col gap-0.5 text-xs">
        <span className="text-zinc-500 dark:text-zinc-400">Details</span>
        <pre className="font-mono whitespace-pre-wrap">{JSON.stringify(item.details, null, 2)}</pre>
      </div>
    </td>
  </tr>
);

export default AuditDetailsRow;
