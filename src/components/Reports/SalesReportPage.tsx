"use client";
import { SaleReport } from "@/types/type";
import React, { use, useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { fetchSaleslist, updateSaleDetails } from "@/app/api/sale/api"; // Asegúrate de que esta ruta sea correcta
import {
  useTable,
  usePagination,
  Column,
  useSortBy,
  useExpanded,
} from "react-table";
import Modal from "../Common/Modal/ModalPage";
import { max } from "date-fns";

const SalesReportPage = () => {
  const [sales, setSales] = useState<SaleReport[]>([]);
  const [showSpinner, setShowSpinner] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRowId, setEditRowId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    customerId: "",
    saleId: "",
    productId: "",
    productName: "",
    quantity: "",
    maxQuantity: 0,
    totalAmount: "",
    totalSoldProduct: 0,
  });

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
    const fetchSales = async () => {
      const session = await getSession();
      try {
        const data = await fetchSaleslist(session?.user?.token || "");
        setSales(data);
      } catch (error) {
        console.error("Error fetching:", error);
        setErrorMessage("Error fetching");
        setShowNotification(true);
      } finally {
        setShowSpinner(false);
        if (showNotification) {
          const timer = setTimeout(() => {
            setShowNotification(false);
          }, 10000); // 10 segundos
          return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
        }
      }
    };
    fetchSales();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleUpdateSale = async () => {
    const session = await getSession();
    try {
      const response = await updateSaleDetails(
        session?.user?.token || "",
        formData.saleId,
        formData.productId,
        Number(formData.quantity)
      );

      // Actualizar la fila editada en el estado
      setSales((prevSales) =>
        prevSales.map((sale) =>
          sale.id === formData.saleId
            ? {
                ...sale,
                details: sale.details.map((detail) =>
                  detail.product.id === formData.productId
                    ? { ...detail, quantity: Number(formData.quantity) }
                    : detail
                ),
              }
            : sale
        )
      );
    } catch (error) {
      console.error("Error updating sale:", error);
    }
  };

  // Calcular el total del producto vendido
  const totalSold = sales.reduce((acc, sale) => {
    return acc + sale.details.reduce((sum, detail) => sum + detail.quantity, 0);
  }, 0);

  return (
    <div>
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
                                    <th className="px-4 py-2 border">Acción</th>
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
                                        <td className="px-4 py-2 border">
                                          <button
                                            title="Editar Producto"
                                            className="text-primary mt-2 mr-2"
                                            onClick={() => {
                                              setEditRowId(row.index);
                                              setIsModalOpen(true);
                                              setFormData({
                                                name: row.original.customer
                                                  .name,
                                                customerId:
                                                  row.original.customer.client_id.toString(),
                                                saleId:
                                                  row.original.id.toString(),
                                                productId:
                                                  item.product.id.toString(),
                                                productName: item.product.name,
                                                quantity:
                                                  item.quantity.toString(),
                                                maxQuantity:
                                                  item.product.quantity,
                                                totalAmount:
                                                  row.original.total_amount.toString(),
                                                totalSoldProduct:
                                                  item.quantity >= 3
                                                    ? item.quantity *
                                                      item.product
                                                        .wholesale_final_cost
                                                    : item.quantity *
                                                      item.product.final_cost,
                                              });
                                            }}
                                          >
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              viewBox="0 0 16 16"
                                              fill="currentColor"
                                              className="size-4"
                                            >
                                              <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                                              <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                                            </svg>
                                          </button>
                                          <button
                                            title="Eliminar Producto"
                                            className="text-primary mt-2 mr-2"
                                          >
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              viewBox="0 0 16 16"
                                              fill="currentColor"
                                              className="size-4"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                          </button>
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
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Editar Venta"
      >
        <div className="max-w-md mx-auto text-primary-contrast">
          <div className="relative">
            <div className="mb-6">
              <label htmlFor="name" className="mb-2 text-sm font-medium">
                Nombre Del Cliente
              </label>
              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                type="text"
                required
                className="block w-full rounded-md border py-1.5"
                disabled
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="productName"
                className="block mb-2 text-sm font-medium"
              >
                Producto (Total del producto vendido:{" "}
                {formData.totalSoldProduct})
              </label>
              <input
                type="text"
                id="productName"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                disabled
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="quantity"
                className="block mb-2 text-sm font-medium"
              >
                Cantidad (Disponible: {formData.maxQuantity})
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                max={formData.maxQuantity}
                value={formData.quantity}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
            </div>

            <button
              className="w-full p-2 bg-primary text-white rounded-lg"
              onClick={() => {
                handleUpdateSale();
                setIsModalOpen(false);
              }}
            >
              <span>Guardar</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default SalesReportPage;
