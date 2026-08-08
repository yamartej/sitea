"use client";
import { SaleReport } from "@/types/type";
import React, { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { fetchSaleslistByCompany } from "@/app/api/sale/api";
import {
  useTable,
  usePagination,
  Column,
  useSortBy,
  useExpanded,
} from "react-table";
import Notification from "@/components/Common/Notification/NotificationPage";
import Spinner from "@/components/Common/Spinner/SpinnerPage";

const SalesReportPage = () => {
  const [sales, setSales] = useState<SaleReport[]>([]);
  const [salesAux, setSalesAux] = useState<SaleReport[]>([]);
  const [showSpinner, setShowSpinner] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [typeMessage, setTypeMessage] = useState("error");
  const [editRowId, setEditRowId] = useState<number | null>(null);
  useEffect(() => {
    const fetchSales = async () => {
      const session = await getSession();
      try {
        setShowSpinner(true);
        const data = await fetchSaleslistByCompany(
          session?.user?.token as string,
          session?.user?.company_id as string
        );
        setSales(data);
        setSalesAux(data);
      } catch (error) {
        console.error("Error fetching:", error);
        setErrorMessage("Error fetching");
        setShowNotification(true);
      } finally {
        setShowSpinner(false);
      }
    };
    fetchSales();
  }, []);

  const columns: Column<SaleReport>[] = React.useMemo(
    () => [
      {
        id: "expander",
        Header: () => null,
        Cell: ({ row }) => (
          // Si tiene nota de crédito, No muestra un icono de expansión
          <span
            {...row.getToggleRowExpandedProps()}
            className={`cursor-pointer text-blue-600 ${
              row.original.credit_note_date ? "hidden" : ""
            }`}
            title={
              row.original.credit_note_date
                ? "No se puede expandir"
                : "Mostrar detalles"
            }
          >
            {row.isExpanded ? "−" : "+"}
          </span>
        ),
      },
      {
        Header: "Id Cliente",
        accessor: (row) => row.customer.client_id,
      },
      {
        Header: "Nombre Cliente",
        accessor: (row) => row.customer.name,
      },
      {
        Header: "Monto Total",
        accessor: (row) => row.total_amount || "Sin Nombre",
      },
      {
        Header: "Tipo de Venta",
        accessor: (row) => row.type_of_sale || "Sin Tipo",
      },
      {
        Header: "Nota de crédito",
        accessor: (row) => (row.credit_note_date ? "Sí" : "No"),
      },
      {
        Header: "Fecha de Venta",
        accessor: (row) =>
          new Date(row.created_at).toLocaleDateString() || "Sin Fecha",
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page, // Filas de la página actual
    canPreviousPage,
    canNextPage,
    pageOptions,
    nextPage,
    previousPage,
    state: { pageIndex, pageSize },
    setPageSize,
  } = useTable(
    {
      columns,
      data: sales,
      initialState: { pageIndex: 0, pageSize: 10 }, // Mostrar 10 registros por página
    },
    useSortBy, // Agregar el plugin de ordenación
    useExpanded,
    usePagination // Agregar el plugin de paginación
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(false);
    }, 10000); // 10 segundos
    return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
  }, [showNotification]); // Dependencia para reiniciar el temporizador

  return (
    <div>
      <div>
        {showSpinner && (
          <div className="spinner-container">
            <Spinner />
          </div>
        )}
      </div>
      <div>
        {showNotification && errorMessage && (
          <Notification
            message={errorMessage}
            type={typeMessage}
            onClose={() => setShowNotification(false)}
          />
        )}
      </div>
      <div>
        <div className="flex justify-between items-center mt-4 text-xs text-primary-contrast">
          <div className="">
            <label htmlFor="pageSize" className="mr-2">
              Filas por página:
            </label>
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
        </div>
      </div>
      <div>
        <input
          type="text"
          placeholder="Buscar por nombre"
          className="block w-full rounded-md border py-1.5 mb-4"
          onChange={(e) => {
            const searchTerm = e.target.value.toLowerCase();
            setSales(
              salesAux.filter((sale) =>
                sale.customer.name.toLowerCase().includes(searchTerm)
              )
            );
          }}
        />
      </div>

      <div className="overflow-x-auto hidden md:block">
        <table
          {...getTableProps()}
          className="w-full text-sm text-left text-gray-500 dark:text-gray-400"
        >
          <thead className="text-xs text-gray-700 uppercase border-b border-t">
            {headerGroups.map((headerGroup) => {
              const { key, ...restHeaderGroupProps } =
                headerGroup.getHeaderGroupProps();
              return (
                <tr key={key} {...restHeaderGroupProps}>
                  {headerGroup.headers.map((column) => {
                    const { key: columnKey, ...restColumnProps } =
                      column.getHeaderProps(column.getSortByToggleProps());
                    return (
                      <th
                        key={columnKey}
                        {...restColumnProps}
                        className="px-4 py-2 cursor-pointer border-t border-b border-gray-200"
                      >
                        {column.render("Header")}
                        {column.canSort && (
                          <span>
                            {column.isSorted
                              ? column.isSortedDesc
                                ? " ↓"
                                : " ↑"
                              : " ↓↑"}
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              );
            })}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map((row) => {
              prepareRow(row);
              const { key: rowKey, ...restRowProps } = row.getRowProps();
              return (
                <React.Fragment key={row.id}>
                  <tr
                    key={rowKey}
                    {...restRowProps}
                    className={`transition ${
                      row.original.id === editRowId
                        ? "bg-yellow-300 border-l-4 border-yellow-500"
                        : "odd:bg-white bg-gray-100 hover:bg-gray-100"
                    }`}
                  >
                    {row.cells.map((cell) => {
                      const { key: cellKey, ...restCellProps } =
                        cell.getCellProps();
                      return (
                        <td
                          key={cellKey}
                          {...restCellProps}
                          className="px-4 py-2"
                        >
                          {cell.render("Cell")}
                        </td>
                      );
                    })}
                  </tr>
                  {row.isExpanded && (
                    <tr className="bg-yellow-300">
                      <td
                        colSpan={row.cells.length}
                        className="px-4 py-2 text-sm text-gray-600"
                      >
                        {/* Aquí va el detalle de la compra, por ejemplo una lista de productos */}

                        <div>
                          <strong className="block mb-2 text-center">
                            Historial de Pagos:
                          </strong>
                          {row.original.details?.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left text-gray-600 border border-gray-200">
                                <thead className="bg-gray-100 text-gray-700">
                                  <tr>
                                    <th className="px-4 py-2 border">
                                      Producto
                                    </th>
                                    <th className="px-4 py-2 border">
                                      Cantidad
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Array.isArray(row.original.details) &&
                                    row.original.details.map((item, i) => (
                                      <tr key={i} className="bg-white">
                                        <td className="px-4 py-2 border">
                                          {item.product.name}
                                        </td>
                                        <td className="px-4 py-2 border">
                                          {item.quantity}
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <em>No hay detalles disponibles.</em>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div>
        <div className="text-right mt-4 text-xs text-gray-700 dark:text-gray-400 border-t border-gray-200 pt-2">
          <button
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
            className="px-4 py-2 bg-primary rounded disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-5"
            >
              <path
                fillRule="evenodd"
                d="M4.72 9.47a.75.75 0 0 0 0 1.06l4.25 4.25a.75.75 0 1 0 1.06-1.06L6.31 10l3.72-3.72a.75.75 0 1 0-1.06-1.06L4.72 9.47Zm9.25-4.25L9.72 9.47a.75.75 0 0 0 0 1.06l4.25 4.25a.75.75 0 1 0 1.06-1.06L11.31 10l3.72-3.72a.75.75 0 0 0-1.06-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <span className="mx-2">
            Página{" "}
            <strong>
              {pageIndex + 1} de {pageOptions.length}
            </strong>
          </span>
          <button
            onClick={() => nextPage()}
            disabled={!canNextPage}
            className="px-4 py-2 bg-primary rounded disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-5"
            >
              <path
                fillRule="evenodd"
                d="M15.28 9.47a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L13.69 10 9.97 6.28a.75.75 0 0 1 1.06-1.06l4.25 4.25ZM6.03 5.22l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L8.69 10 4.97 6.28a.75.75 0 0 1 1.06-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
export default SalesReportPage;
