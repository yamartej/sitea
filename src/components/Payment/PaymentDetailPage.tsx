"use client";
import React, { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { Sale, PaymentDetail } from "@/types/type";
import {
  fetchSaleCretitList,
  registerPay,
  removePayment,
} from "@/app/api/admin/api";
import Spinner from "@/components/Common/Spinner/SpinnerPage";
import Notification from "../Common/Notification/NotificationPage";
import {
  useTable,
  usePagination,
  Column,
  useSortBy,
  useExpanded,
} from "react-table";
import Modal from "../Common/Modal/ModalPage";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Swal from "sweetalert2";

const PaymentDetailPage = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [showSpinner, setShowSpinner] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [typeMessage, setTypeMessage] = useState("error");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRowId, setEditRowId] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    id: 0,
    amount: null,
    paymentDate: new Date(),
    detail: "",
  });
  const [errors, setErrors] = useState<{
    amountInf: string | null;
  }>({
    amountInf: null,
  });

  useEffect(() => {
    setShowSpinner(true);
    const fetchCustomers = async () => {
      setShowSpinner(true);
      const session = await getSession();
      try {
        const data = await fetchSaleCretitList(session?.user.token as string);
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
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 10000); // 10 segundos
      return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
    }
  }, [showNotification]);

  const columns: Column<Sale>[] = React.useMemo(
    () => [
      {
        id: "expander",
        Header: () => null,
        Cell: ({ row }) => (
          <span
            {...row.getToggleRowExpandedProps()}
            className="cursor-pointer text-blue-600"
            title="Mostrar detalles"
          >
            {row.isExpanded ? "−" : "+"}
          </span>
        ),
      },
      {
        Header: "Cliente",
        accessor: (row) => row.customer?.name || "Sin Nombre",
      },
      {
        Header: "Deuda Pendiente",
        accessor: "total_amount",
      },
      {
        Header: "Total Pagado",
        accessor: (row) => {
          const total = row.payment_details?.reduce((sum, payment) => {
            return sum + parseFloat(Number(payment.amount).toFixed(2));
          }, 0);
          return total;
        },
      },
      {
        Header: "Fecha de compra",
        accessor: "created_at",
      },
      {
        Header: "Acciones",
        Cell: ({ row }) => (
          <div className="flex justify-center space-x-2">
            <button
              title="Editar Producto"
              onClick={() => handleEditQuota(row.original)}
              className="text-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="size-4"
              >
                <path
                  fillRule="evenodd"
                  d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3Zm9 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-6.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM11.5 6A.75.75 0 1 1 13 6a.75.75 0 0 1-1.5 0Z"
                  clipRule="evenodd"
                />
                <path d="M13 11.75a.75.75 0 0 0-1.5 0v.179c0 .15-.138.28-.306.255A65.277 65.277 0 0 0 1.75 11.5a.75.75 0 0 0 0 1.5c3.135 0 6.215.228 9.227.668A1.764 1.764 0 0 0 13 11.928v-.178Z" />
              </svg>
            </button>
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
      data: sales,
      initialState: { pageIndex: 0, pageSize: 10 }, // Mostrar 10 registros por página
    },
    useSortBy, // Agregar el plugin de ordenación
    useExpanded,
    usePagination // Agregar el plugin de paginación
  );

  const handleEditQuota = (sale: Sale) => {
    setFormData({
      id: sale.id,
      amount: null,
      paymentDate: new Date(),
      detail: "",
    });

    const totalAmount = sale.total_amount;
    const totalPaid = sale.payment_details.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount);
    }, 0);
    setBalance(totalAmount - totalPaid);
    setEditRowId(sale.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsModalOpen(false);
    setShowSpinner(true);
    try {
      if (errors.amountInf) {
        setShowNotification(true);
        setErrorMessage("El Monto es mayor a la deuda");
        setTypeMessage("error");
      } else {
        const session = await getSession();
        const response = await registerPay(
          session?.user.token as any,
          Number(formData.id),
          Number(formData.amount),
          format(formData.paymentDate, "yyyy-MM-dd"),
          formData.detail
        );

        if (response) {
          setSales((prevSales) =>
            prevSales.map((sale) =>
              sale.id === formData.id
                ? {
                    ...sale,
                    payment_details: [
                      ...(sale.payment_details || []),
                      {
                        id: response.id,
                        sale_id: sale.id,
                        amount: response.amount,
                        payment_date: response.payment_date,
                        detail: formData.detail,
                      } as PaymentDetail,
                    ],
                  }
                : sale
            )
          );
          setShowNotification(true);
          setErrorMessage("El pago fue creado correctamente");
          setTypeMessage("success");
          clearInputs();
        } else {
          setErrorMessage(response.message);
        }
      }
    } catch (errors) {
      console.error("Error:", errors);
    } finally {
      setShowSpinner(false);
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData((prevData) => ({
        ...prevData,
        paymentDate: date, // Actualizar la fecha seleccionada
      }));
    }
  };

  const handleRemovePayment = async (id: number) => {
    Swal.fire({
      title: "¿Estás seguro de que deseas eliminar este Pago?",
      text: "No podrás revertir esto.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#72cb10",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminarlo!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const session = await getSession();
        const response = await removePayment(session?.user.token as any, id);
        if (response) {
          setShowNotification(true);
          setErrorMessage("Pago eliminado correctamente");
          setTypeMessage("success");
          setSales((prevSales) =>
            prevSales.map((sale) => ({
              ...sale,
              payment_details: sale.payment_details
                ? sale.payment_details.filter((payment) => payment.id !== id)
                : [],
            }))
          );
        } else {
          setShowNotification(true);
          setErrorMessage("Error al eliminar el punto de venta");
          setTypeMessage("error");
        }
      }
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === "amount") {
      setErrors({
        ...errors,
        amountInf:
          Number(value) > (balance ?? 0)
            ? "El monto a cancelar es mayor a la deuda"
            : null,
      });
    }
  };

  const clearInputs = () => {
    setFormData({
      id: 0,
      amount: null,
      detail: "",
      paymentDate: new Date(),
    });
  };

  return (
    <>
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
                          {row.original.payment_details?.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left text-gray-600 border border-gray-200">
                                <thead className="bg-gray-100 text-gray-700">
                                  <tr>
                                    <th className="px-4 py-2 border">Monto</th>
                                    <th className="px-4 py-2 border">
                                      Fecha de Pago
                                    </th>
                                    <th className="px-4 py-2 border">
                                      Detalle
                                    </th>
                                    <th className="px-4 py-2 border">Acción</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.original.payment_details.map(
                                    (item, i) => (
                                      <tr key={i} className="bg-white">
                                        <td className="px-4 py-2 border">
                                          {item.amount}
                                        </td>
                                        <td className="px-4 py-2 border">
                                          {item.payment_date instanceof Date
                                            ? item.payment_date.toLocaleDateString()
                                            : item.payment_date}
                                        </td>
                                        <td className="px-4 py-2 border">
                                          {item.detail}
                                        </td>
                                        <td className="px-4 py-2 border">
                                          <button
                                            title="Editar Producto"
                                            onClick={() =>
                                              handleRemovePayment(item.id)
                                            }
                                            className="text-primary"
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
                                    )
                                  )}
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
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditRowId(null);
        }}
        title="Agregar Pago"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 mb-6 md:grid-cols-2 text-primary-contrast">
            <div>
              <label
                htmlFor="amount"
                className="block mb-2 text-sm font-medium"
              >
                Monto
              </label>
              <input
                id="amount"
                name="amount"
                type="Number"
                value={formData.amount ?? ""}
                onChange={handleInputChange}
                required
                className="block w-full rounded-md border py-1.5"
              />
            </div>
            <div className="">
              <label
                htmlFor="paymentDate"
                className="block mb-2 text-sm font-medium"
              >
                Fecha de Pago
              </label>
              <ReactDatePicker
                selected={
                  formData.paymentDate instanceof Date
                    ? formData.paymentDate
                    : null
                }
                onChange={handleDateChange}
                dateFormat="dd- MM-yyyy"
                locale={es}
                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
            </div>
          </div>
          <div className="grid gap-6 mb-6 md:grid-cols-1 text-primary-contrast">
            <div>
              <label
                htmlFor="detail"
                className="block mb-2 text-sm font-medium"
              >
                Detalle
              </label>
              <textarea
                id="detail"
                name="detail"
                onChange={handleInputChange}
                value={formData.detail}
                rows={4}
                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Escribe cualquier detalle"
                defaultValue={""}
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white"
          >
            Guardar
          </button>
        </form>
      </Modal>
    </>
  );
};

export default PaymentDetailPage;
