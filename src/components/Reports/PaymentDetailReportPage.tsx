"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getSession } from "next-auth/react";
import {
  fetchPeymentDetailList,
  fetchPaymentListByDate,
} from "@/app/api/admin/api";
import { PaymentDetailReport } from "@/types/type";
import { format } from "date-fns";
import Spinner from "../Common/Spinner/SpinnerPage";
import Notification from "../Common/Notification/NotificationPage";
import {
  useTable,
  usePagination,
  useSortBy,
  useExpanded,
  Column,
} from "react-table";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale";
import InfoCardGrid from "../Common/Card/InfoCardGrid";

const PaymentDetailReportPage = () => {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailReport[]>(
    []
  );
  const [paymentDetailsAux, setPaymentDetailsAux] = useState<
    PaymentDetailReport[]
  >([]);
  const [showSpinner, setShowSpinner] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [typeMessage, setTypeMessage] = useState<"error" | "success">("error");

  const [formData, setFormData] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      setShowSpinner(true);
      try {
        const session = await getSession();
        const token = session?.user?.token;

        if (!token) {
          throw new Error("Token no encontrado");
        }

        const data = await fetchPeymentDetailList(token);
        setPaymentDetails(data);
        setPaymentDetailsAux(data);
      } catch (error) {
        setErrorMessage("Error al obtener los detalles de pago.");
        setShowNotification(true);
      } finally {
        setShowSpinner(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const columns: Column<PaymentDetailReport>[] = useMemo(
    () => [
      {
        Header: "Cliente ID",
        accessor: "customer_id",
      },
      {
        Header: "Nombre",
        accessor: (row) => row.customer?.name || "N/A",
      },
      {
        Header: "Monto",
        accessor: "amount",
      },
      {
        Header: "Fecha de Pago",
        accessor: "payment_date",
        Cell: ({ row }) => (
          <div>
            {row.original.payment_date
              ? format(new Date(row.original.payment_date), "dd-MM-yyyy")
              : "—"}
          </div>
        ),
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
      data: paymentDetails,
      initialState: { pageIndex: 0, pageSize: 10 }, // Mostrar 10 registros por página
    },
    useSortBy, // Agregar el plugin de ordenación
    useExpanded,
    usePagination // Agregar el plugin de paginación
  );

  const handleSearchPaymentsDetail = async () => {
    const session = await getSession();
    setShowSpinner(true);
    try {
      const token = session?.user?.token;
      if (!token) {
        throw new Error("Token no encontrado");
      }

      const data = await fetchPaymentListByDate(
        token,
        formData.startDate ? formData.startDate.toISOString() : "",
        formData.endDate ? formData.endDate.toISOString() : ""
      );
      setPaymentDetails(data);
      setPaymentDetailsAux(data);
    } catch (error) {
      setErrorMessage("Error al buscar los detalles de pago.");
      setShowNotification(true);
    } finally {
      setShowSpinner(false);
    }
  };
  const cards = [
    { title: "Total de Pagos", value: paymentDetails.length.toString() },
    {
      title: "Monto Total de Pagos",
      value: paymentDetails
        .reduce((acc, payment) => acc + Number(payment.amount), 0)
        .toFixed(2),
    },
  ];

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

      <div className="mb-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative">
          <label className="block text-sm">Fecha inicio:</label>
          <ReactDatePicker
            selected={formData.startDate}
            onChange={(date) => setFormData({ ...formData, startDate: date })}
            locale={es}
            dateFormat="dd-MM-yyyy"
            className="border p-1 rounded w-full pr-8"
          />
          {formData.startDate && (
            <button
              type="button"
              onClick={() => setFormData({ ...formData, startDate: null })}
              className="absolute right-2 top-8 text-gray-400 hover:text-red-500"
              tabIndex={-1}
              aria-label="Limpiar fecha"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              {/* Ícono X */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="relative">
          <label className="block text-sm">Fecha fin:</label>
          <ReactDatePicker
            selected={formData.endDate}
            onChange={(date) => setFormData({ ...formData, endDate: date })}
            locale={es}
            dateFormat="dd-MM-yyyy"
            className="border p-1 rounded w-full pr-8"
          />
          {formData.endDate && (
            <button
              type="button"
              onClick={() => setFormData({ ...formData, endDate: null })}
              className="absolute right-2 top-8 text-gray-400 hover:text-red-500"
              tabIndex={-1}
              aria-label="Limpiar fecha"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
              }}
            >
              {/* Ícono X */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        <div>
          <button
            onClick={handleSearchPaymentsDetail}
            className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white"
          >
            Buscar
          </button>
        </div>
      </div>
      <div className="mb-4">
        <div>
          <InfoCardGrid cards={cards} />
        </div>
      </div>
      <div>
        <input
          type="text"
          placeholder="Buscar por nombre"
          className="block w-full rounded-md border py-1.5 mb-4"
          onChange={(e) => {
            const searchTerm = e.target.value.toLowerCase();
            setPaymentDetails(
              paymentDetailsAux.filter((paymentDetail) =>
                paymentDetail.customer.name.toLowerCase().includes(searchTerm)
              )
            );
          }}
        />
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
              return (
                <tr
                  {...row.getRowProps()}
                  className="odd:bg-white bg-gray-100 hover:bg-gray-100 transition"
                >
                  {row.cells.map((cell) => (
                    <td {...cell.getCellProps()} className="px-4 py-2">
                      {cell.render("Cell")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="block md:hidden mt-2 space-y-4">
        {paymentDetails?.map((paymentDetail) => (
          <div
            key={paymentDetail.id}
            className="p-4 bg-white rounded-lg shadow border border-gray-300"
          >
            <p>
              <span className="font-semibold">Id:</span>{" "}
              {paymentDetail.customer.id}
            </p>
            <p>
              <span className="font-semibold">Nombre:</span>{" "}
              {paymentDetail.customer.name}
            </p>
            <p>
              <span className="font-semibold">Monto:</span>{" "}
              {paymentDetail.amount}
            </p>
            <p>
              <span className="font-semibold">Fecha de Pago:</span>{" "}
              {paymentDetail.payment_date
                ? format(new Date(paymentDetail.payment_date), "dd-MM-yyyy")
                : "—"}
            </p>
          </div>
        ))}
      </div>

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
  );
};

export default PaymentDetailReportPage;
