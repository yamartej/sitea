"use client";
import React from 'react';
import { useTable, usePagination, useRowSelect } from 'react-table';

const PaymentPage = () => {
    // Datos ficticios para la tabla
    const data = React.useMemo(
        () => [
            { id: 1, name: 'John Doe', amount: 150.25, date: '2025-04-01' },
            { id: 2, name: 'Jane Smith', amount: 200.75, date: '2025-04-02' },
            { id: 3, name: 'Alice Johnson', amount: 300.50, date: '2025-04-03' },

            { id: 4, name: 'Bob Brown', amount: 400.00, date: '2025-04-04' },
            { id: 5, name: 'Charlie Green', amount: 500.80, date: '2025-04-05' },
            { id: 6, name: 'Diana Prince', amount: 600.90, date: '2025-04-06' },
            { id: 7, name: 'Ethan Hunt', amount: 700.10, date: '2025-04-07' },
            { id: 8, name: 'Fiona Apple', amount: 800.20, date: '2025-04-08' },
            { id: 9, name: 'George Clooney', amount: 900.30, date: '2025-04-09' },
            { id: 10, name: 'Hannah Montana', amount: 1000.40, date: '2025-04-10' },
            { id: 11, name: 'Ian Somerhalder', amount: 1100.50, date: '2025-04-11' },
            { id: 12, name: 'Jessica Alba', amount: 1200.60, date: '2025-04-12' },
            { id: 13, name: 'Kevin Spacey', amount: 1300.70, date: '2025-04-13' },
            { id: 14, name: 'Liam Neeson', amount: 1400.80, date: '2025-04-14' },
            { id: 15, name: 'Megan Fox', amount: 1500.90, date: '2025-04-15' },
            { id: 16, name: 'Nicolas Cage', amount: 1600.00, date: '2025-04-16' },
            { id: 17, name: 'Olivia Wilde', amount: 1700.10, date: '2025-04-17' },
            { id: 18, name: 'Paul Rudd', amount: 1800.20, date: '2025-04-18' },
            { id: 19, name: 'Quentin Tarantino', amount: 1900.30, date: '2025-04-19' },
            { id: 20, name: 'Rachel McAdams', amount: 2000.40, date: '2025-04-20' },
            { id: 21, name: 'Samuel L. Jackson', amount: 2100.50, date: '2025-04-21' },
            { id: 22, name: 'Tom Hanks', amount: 2200.60, date: '2025-04-22' },
            { id: 23, name: 'Uma Thurman', amount: 2300.70, date: '2025-04-23' },
            { id: 24, name: 'Vin Diesel', amount: 2400.80, date: '2025-04-24' },
            { id: 25, name: 'Will Smith', amount: 2500.90, date: '2025-04-25' },
        ],
        []
    );

        const columns = React.useMemo(
        () => [
            {
                Header: 'ID',
                accessor: 'id' as const, // Accede al campo "id"
            },
            {
                Header: ({ getToggleAllRowsSelectedProps }: any) => (
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            {...getToggleAllRowsSelectedProps()} // Checkbox para seleccionar todas las filas
                            className="mr-2"
                        />
                        Nombre
                    </div>
                ),
                accessor: 'name' as const, // Accede al campo "name"
                Cell: ({ row }: any) => (
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            {...row.getToggleRowSelectedProps()} // Checkbox para seleccionar la fila
                            className="mr-2"
                        />
                        {row.original.name} {/* Mostrar el nombre */}
                    </div>
                ),
            },
            {
                Header: 'Monto',
                accessor: 'amount' as const, // Accede al campo "amount"
                Cell: ({ value }: { value: number }) =>
                    Number(value).toLocaleString('es-ES', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }), // Formatear como moneda
            },
            {
                Header: 'Fecha',
                accessor: 'date' as const, // Accede al campo "date"
            },
        ],
        []
    );

    // Inicializar la tabla con react-table
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
        page, // Filas de la página actual
        canPreviousPage,
        canNextPage,
        pageOptions,
        nextPage,
        previousPage,
        state: { pageIndex, pageSize },
        setPageSize,
        selectedFlatRows,
    } = useTable(
        { 
            columns, 
            data,
            initialState: { pageIndex: 0, pageSize: 10 } as any, // Mostrar 10 registros por página
        },
        usePagination, // Agregar el plugin de paginación
        useRowSelect,
    );
    return (
        <div className="overflow-x-auto hidden md:block">
            <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 mt-14">
                <h1 className="text-2xl font-bold mb-4">Pagos</h1>
                <div className="overflow-x-auto">
                    <table
                        {...getTableProps()}
                        className="w-full text-sm text-left text-gray-500 dark:text-gray-400"
                    >
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            {headerGroups.map((headerGroup) => (
                                <tr {...headerGroup.getHeaderGroupProps()}>
                                    {headerGroup.headers.map((column) => (
                                        <th
                                            {...column.getHeaderProps()}
                                            className="px-6 py-3"
                                        >
                                            {column.render('Header')}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody {...getTableBodyProps()}>
                            {page.map((row: any) => {
                                prepareRow(row);
                                return (
                                    <tr
                                        {...row.getRowProps()}
                                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                                    >
                                        {row.cells.map((cell: any) => (
                                            <td
                                                {...cell.getCellProps()}
                                                className="px-6 py-4"
                                            >
                                                {cell.render('Cell')}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {/* Controles de paginación */}
                <div className="flex justify-between items-center mt-4">
                    {/* Selector de filas por página */}
                    <div className="flex items-center">
                        <label htmlFor="pageSize" className="mr-2">Filas por página:</label>
                        <select
                            id="pageSize"
                            value={pageSize}
                            onChange={(e) => {
                                const value = Number(e.target.value);
                                setPageSize(value);
                            }}
                            className="border rounded p-1"
                        >
                            {[5, 10, 20, 50].map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                
                    {/* Controles de paginación */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => previousPage()}
                            disabled={!canPreviousPage}
                            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <span>
                            Página{' '}
                            <strong>
                                {pageIndex + 1} de {pageOptions.length}
                            </strong>
                        </span>
                        <button
                            onClick={() => nextPage()}
                            disabled={!canNextPage}
                            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;