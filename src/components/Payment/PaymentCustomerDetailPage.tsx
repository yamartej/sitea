"use client";
import React, { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { CreditByCustomer } from "@/types/type";
import {
  fetchCretitListByCustomerByCompany,
  registerCustomerPay,
  removePaymentCustomerDetail,
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
import InfoCardGrid from "../Common/Card/InfoCardGrid";

const PaymentCustomerDetailPage = () => {
  const [sales, setSales] = useState<CreditByCustomer[]>([]);
  const [salesAux, setSalesAux] = useState<CreditByCustomer[]>([]);
  const [showSpinner, setShowSpinner] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [typeMessage, setTypeMessage] = useState("error");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRowId, setEditRowId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    id: 0,
    amount: 0,
    paymentDate: new Date(),
    detail: "",
  });
  const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    setShowSpinner(true);
    const fetchCustomers = async () => {
      setShowSpinner(true);
      const session = await getSession();
      try {
        const data = await fetchCretitListByCustomerByCompany(
          session?.user.token as string,
          session?.user.company_id as string
        );
        const newData = data
          .map((data: CreditByCustomer) => {
            const total = data.payments.reduce(
              (suma, pago) => suma + Number(pago.amount),
              0
            );
            const debtToPay = data.total_debt - total;
            return { ...data, debtToPay };
          })
          .filter((data: CreditByCustomer) => data.debtToPay > 0);

        setSales(newData);
        setSalesAux(newData);
      } catch (error) {
        console.error("Error fetching:", error);
        setErrorMessage("Error fetching");
        setShowNotification(true);
      } finally {
        setShowSpinner(false);
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

  const columns: Column<CreditByCustomer>[] = React.useMemo(
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
        accessor: (row) => row.customer_name || "Sin Nombre",
      },
      {
        Header: "Deuda Total",
        accessor: (row) => row.total_debt || "Sin Nombre",
      },
      {
        Header: "Deuda Pendiente",
        // Restar la suma de los pagos al total_debt
        accessor: (row) => {
          const totalPaid = row.payments?.reduce(
            (acc, payment) => acc + Number(payment.amount),
            0
          );
          return row.total_debt - (totalPaid || 0);
        },
      },
      {
        Header: "Total Pagado",
        accessor: (row) => {
          const totalPaid = row.payments?.reduce(
            (acc, payment) => acc + Number(payment.amount),
            0
          );
          return totalPaid || 0;
        },
      },
      {
        Header: "Acciones",
        Cell: ({ row }) => (
          <div className="flex justify-center space-x-2">
            <button
              title="Agregar Pago"
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
  const handleEditQuota = (CreditByCustomer: CreditByCustomer) => {
    console.log("CreditByCustomer", CreditByCustomer);
    //Obtener la suma de los pagos realizados
    const totalPaid = CreditByCustomer.payments?.reduce(
      (acc, payment) => acc + Number(payment.amount),
      0
    );
    const debtToPay = CreditByCustomer.total_debt - (totalPaid || 0);
    setPaymentAmount(debtToPay);
    setEditRowId(CreditByCustomer.customer_id);
    setFormData({
      id: CreditByCustomer.customer_id,
      amount: 0,
      paymentDate: new Date(),
      detail: "",
    });
    setIsModalOpen(true);
  };

  const handleRemovePayment = async (items: CreditByCustomer) => {
    console.log("items", items);
    console.log("expandedSaleId", expandedSaleId);
    console.log("FormData", formData);
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
        const response = await removePaymentCustomerDetail(
          session?.user.token as string,
          items.id
        );
        if (response) {
          setSales((prevSales) =>
            prevSales.map((sale) =>
              sale.customer_id === items.customer_id
                ? {
                    ...sale,
                    payments: sale.payments
                      ? sale.payments.filter(
                          (payment) => payment.id !== items.id
                        )
                      : [],
                  }
                : sale
            )
          );
          setShowNotification(true);
          setErrorMessage("El pago fue eliminado correctamente");
          setTypeMessage("success");
        }
      } else {
        setShowNotification(true);
        setErrorMessage("Error al eliminar el punto de venta");
        setTypeMessage("error");
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (formData.amount > paymentAmount) {
        setShowNotification(true);
        setErrorMessage("El Monto es mayor a la deuda");
        setTypeMessage("error");
      } else {
        setIsModalOpen(false);
        setShowSpinner(true);
        const session = await getSession();
        const response = await registerCustomerPay(
          session?.user.token as string,
          Number(formData.id),
          Number(formData.amount),
          format(formData.paymentDate, "yyyy-MM-dd"),
          formData.detail
        );

        if (response) {
          setSales((prevSales) =>
            prevSales.map((sale) =>
              sale.customer_id === formData.id
                ? {
                    ...sale,
                    payments: [
                      ...(sale.payments || []),
                      {
                        id: Number(response.id),
                        customer_id: Number(sale.customer_id), // or use the correct sale_id if available
                        amount: formData.amount,
                        payment_date: formData.paymentDate,
                        detail: formData.detail,
                      },
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
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData((prevData) => ({
        ...prevData,
        paymentDate: date,
      }));
    }
  };
  const clearInputs = () => {
    setFormData({
      id: 0,
      amount: 0,
      paymentDate: new Date(),
      detail: "",
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
      <div className="mb-4">
        <InfoCardGrid
          cards={[
            {
              title: "Total Deuda",
              value: sales.reduce(
                (acc, sale) => acc + Number(sale.total_debt),
                0
              ),
            },
            {
              title: "Total Pagado",
              value: sales
                .reduce(
                  (acc, sale) =>
                    acc +
                    (sale.payments?.reduce(
                      (paymentAcc, payment) =>
                        paymentAcc + Number(payment.amount),
                      0
                    ) || 0),
                  0
                )
                .toFixed(2),
            },
            {
              title: "Deuda Pendiente",
              value: sales
                .reduce(
                  (acc, sale) =>
                    acc +
                    (sale.total_debt -
                      (sale.payments?.reduce(
                        (paymentAcc, payment) =>
                          paymentAcc + Number(payment.amount),
                        0
                      ) || 0)),
                  0
                )
                .toFixed(2),
            },
          ]}
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
      <div>
        <input
          type="text"
          placeholder="Buscar por nombre"
          className="block w-full rounded-md border py-1.5 mb-4"
          onChange={(e) => {
            const searchTerm = e.target.value.toLowerCase();
            setSales(
              salesAux.filter((sale) =>
                sale.customer_name.toLowerCase().includes(searchTerm)
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
                          {row.original.payments?.length > 0 ? (
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
                                  {row.original.payments.map((item, i) => (
                                    <tr key={i} className="bg-white">
                                      <td className="px-4 py-2 border">
                                        {item.amount}
                                      </td>
                                      <td className="px-4 py-2 border">
                                        {item.payment_date
                                          ? format(
                                              new Date(item.payment_date),
                                              "dd-MM-yyyy"
                                            )
                                          : ""}
                                      </td>
                                      <td className="px-4 py-2 border">
                                        {item.detail}
                                      </td>
                                      <td className="px-4 py-2 border">
                                        <button
                                          title="Editar Producto"
                                          onClick={() =>
                                            handleRemovePayment(item as any)
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
      <div className="block md:hidden mt-2 space-y-4">
        {sales?.map((sale) => (
          <div
            key={sale.id}
            className="p-4 bg-white rounded-lg shadow border border-gray-300"
          >
            <p>
              <span className="font-semibold">Cliente:</span>{" "}
              {sale.customer_name}
            </p>
            <p>
              <span className="font-semibold">Deuda Pendiente:</span>{" "}
              {sale.total_debt}
            </p>
            <p>
              <span className="font-semibold">Total Pagado:</span>{" "}
              {sale.payments?.reduce(
                (acc, payment) => acc + Number(payment.amount),
                0
              )}
            </p>
            <div className="mt-2 flex justify-end space-x-2">
              <button
                title="Agregar Pago"
                onClick={() => handleEditQuota(sale)}
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
              <button
                title={
                  expandedSaleId === sale.id ? "Ocultar pagos" : "Ver pagos"
                }
                onClick={() =>
                  setExpandedSaleId(expandedSaleId === sale.id ? null : sale.id)
                }
                className="text-primary"
              >
                {expandedSaleId === sale.id ? "−" : "+"}
              </button>
            </div>
            {expandedSaleId === sale.id && (
              <div className="mt-4">
                <strong className="block mb-2 text-center">
                  Historial de Pagos:
                </strong>
                {sale.payments?.length > 0 ? (
                  <>
                    <p className="font-semibold">Detalles de Pagos:</p>
                    {sale.payments.map((item, i) => (
                      <div
                        key={item.id}
                        className="p-4 bg-white rounded-lg shadow border border-gray-300"
                      >
                        <p>
                          <span className="font-semibold">Id:</span> {item.id}
                        </p>
                        <p>
                          <span className="font-semibold">Monto:</span>{" "}
                          {item.amount}
                        </p>
                        <p>
                          <span className="font-semibold">Fecha:</span>
                          {item.payment_date
                            ? format(new Date(item.payment_date), "dd-MM-yyyy")
                            : ""}
                        </p>

                        <div className="mt-2 flex justify-end space-x-2">
                          <button
                            title="Eliminar Producto"
                            onClick={() => handleRemovePayment(item as any)}
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
                                d="M1.5 4a.5.5 0 0 1 .5-.5h12a.5.5 0 0 1 .5.5v1h-13V4Zm2.5-2a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5V4h-9V2ZM3 6h10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Zm1 .75v7.25a.25.25 0 0 0 .25.25h8a.25.25 0 0 0 .25-.25V6.75H4Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <em>No hay detalles disponibles.</em>
                )}
              </div>
            )}
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

export default PaymentCustomerDetailPage;
