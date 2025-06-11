"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getSession } from "next-auth/react";
import { fetchPeymentDetailList } from "@/app/api/admin/api";
import { PaymentDetail } from "@/types/type";
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

const PaymentDetailReportPage = () => {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
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

  const columns: Column<PaymentDetail>[] = useMemo(
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
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex },
  } = useTable(
    {
      columns,
      data: paymentDetails,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useSortBy,
    useExpanded,
    usePagination
  );

  const handleSearchPaymentsDetail = async () => {
    console.log(formData.startDate);
    console.log(formData.endDate);
    const session = await getSession();
    if (formData.startDate || formData.endDate) {
      console.log("Tiene data");
      const response = await paymentDetailsByDate(
        session?.user.token as any,
        formData.startDate,
        formData.endDate
      );
    }
  };

  return (
    <div className="p-4">
      {showSpinner && <Spinner />}
      {showNotification && (
        <Notification type={typeMessage} message={errorMessage} />
      )}

      <div className="mb-4 flex flex-col md:flex-row gap-4 items-center">
        <div>
          <label className="block text-sm">Fecha inicio:</label>
          <ReactDatePicker
            selected={formData.startDate}
            onChange={(date) => setFormData({ ...formData, startDate: date })}
            locale={es}
            dateFormat="dd-MM-yyyy"
            className="border p-1 rounded"
          />
        </div>
        <div>
          <label className="block text-sm">Fecha fin:</label>
          <ReactDatePicker
            selected={formData.endDate}
            onChange={(date) => setFormData({ ...formData, endDate: date })}
            locale={es}
            dateFormat="dd-MM-yyyy"
            className="border p-1 rounded"
          />
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

      <table {...getTableProps()} className="table-auto w-full border">
        <thead>
          {headerGroups.map((group) => (
            <tr {...group.getHeaderGroupProps()} className="bg-gray-100">
              {group.headers.map((col) => (
                <th
                  {...col.getHeaderProps(col.getSortByToggleProps())}
                  className="p-2 border-b text-left"
                >
                  {col.render("Header")}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} className="hover:bg-gray-50">
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()} className="p-2 border-b">
                    {cell.render("Cell")}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => previousPage()}
          disabled={!canPreviousPage}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span>
          Página {pageIndex + 1} de {pageOptions.length}
        </span>
        <button
          onClick={() => nextPage()}
          disabled={!canNextPage}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default PaymentDetailReportPage;
