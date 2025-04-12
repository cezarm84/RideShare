import React from 'react';

interface DataTableProps {
  data: any[];
  columns: any[];
  [key: string]: any;
}

export const DataTable: React.FC<DataTableProps> = ({ data, columns, ...props }) => {
  return (
    <div data-testid="data-table">
      <table>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, colIndex) => (
                <td key={colIndex}>{row[column.accessorKey]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
