import React from 'react';

interface Column {
  header: string;
  accessor: string;
}

interface GenericTableProps<T> {
  columns: Column[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (id: number) => void;
  actionDescription?: string;
}

const GenericTable = <T extends { id: number }>({
  columns,
  data,
  onEdit,
  onDelete,
  actionDescription,
}: GenericTableProps<T>) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300 text-left">
        <thead>
          <tr className="bg-gray-200">
            {columns.map((column) => (
              <th key={column.accessor} className="px-4 py-2 border border-gray-300">
                {column.header}
              </th>
            ))}
            {(onEdit || onDelete) && <th className="px-4 py-2 border border-gray-300">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="bg-white hover:bg-gray-100 transition">
              {columns.map((column) => (
                <td key={column.accessor} className="px-4 py-2 border border-gray-300">
                  {String(item[column.accessor as keyof T])}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-4 py-2 border border-gray-300 text-center">
                  {onEdit && (
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => onEdit(item)}
                    >
                    {actionDescription || 'Editar'}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="ml-2 text-red-600 hover:underline"
                      onClick={() => onDelete(item.id)}
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GenericTable;