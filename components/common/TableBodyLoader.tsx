import Loader from './Loader';

interface Props extends React.HTMLAttributes<HTMLTableSectionElement> {
  columns: number;
  rows: number;
}

const TableBodyLoader = ({ columns, rows, ...props }: Props) => {
  return (
    <tbody {...props}>
      {[...Array(rows)].map((_, i) => (
        <tr key={i} className="border-t first:border-0 border-zinc-300 dark:border-zinc-500">
          {[...Array(columns)].map((_, j) => (
            <td key={j}>
              <div className="py-2.75 px-2">
                <Loader isLoading>
                  <div className="h-7" />
                </Loader>
              </div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};

export default TableBodyLoader;
