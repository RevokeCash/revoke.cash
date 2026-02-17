import { flexRender, type Table } from '@tanstack/react-table';

interface Props<T> {
  table: Table<T>;
}

const TableHeader = <T,>({ table }: Props<T>) => {
  return (
    <thead>
      {table.getHeaderGroups().map((headerGroup) => (
        <tr key={headerGroup.id} className="border-b border-black dark:border-white h-10">
          {headerGroup.headers.map((header) => (
            <th key={header.id} className="text-left px-2 whitespace-nowrap">
              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
            </th>
          ))}
        </tr>
      ))}
    </thead>
  );
};

export default TableHeader;
