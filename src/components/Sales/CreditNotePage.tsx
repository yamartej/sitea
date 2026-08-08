"use client";
import { useEffect, useState } from "react";
import {
  fetchCustomersListByCompany,
  creditCustomerRegister,
  fetchCustomerCreditNoteListByCompany,
  removeCreditNote,
  updateCreditNote,
} from "@/app/api/admin/api";
import { getSession } from "next-auth/react";
import { Customer, CustomerCreditNote } from "@/types/type";
import Notification from "../Common/Notification/NotificationPage";
import Spinner from "../Common/Spinner/SpinnerPage";
import React from "react";
import { useTable, usePagination, Column, useSortBy } from "react-table";
import Modal from "../Common/Modal/ModalPage";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale/es"; // Importa el locale español
import Swal from "sweetalert2";
import { format } from "date-fns";

const CreditNotePage = () => {
  const [customersData, setCustomersData] = useState<Customer[]>([]);
  const [customersDataAux, setCustomersDataAux] = useState<Customer[]>([]);
  const [customers, setCustomers] = useState<CustomerCreditNote[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [formDataCn, setFormDataCn] = useState({
    id: "" as number | string,
    creditNoteAmount: "" as string,
    creditNoteDate: "" as Date | string,
    creditNoteDetail: "" as string,
  });
  const [typeMessage, setTypeMessage] = useState("error");
  const [isModalOpenCustomer, setIsModalOpenCustomer] = useState(false);
  const [isModalOpenCn, setIsModalOpenCn] = useState(false);
  const [errors, setErrors] = useState<{
    amontError: string | null;
  }>({
    amontError: null,
  });
  const [typeRequest, setTypeRequest] = useState("create");

  useEffect(() => {
    setShowSpinner(true);
    const fetchProducts = async () => {
      setShowSpinner(true);
      const session = await getSession();
      try {
        const customersData = await fetchCustomersListByCompany(
          session?.user.token as string,
          session?.user.company_id as string
        );
        const customersInfo = await fetchCustomerCreditNoteListByCompany(
          session?.user.token as string,
          session?.user.company_id as string
        );
        setCustomersData(customersData);
        setCustomersDataAux(customersData);
        setCustomers(customersInfo);
      } catch (error) {
        console.error("Error fetching:", error);
        setErrorMessage("Error fetching");
        setShowNotification(true);
      } finally {
        setShowSpinner(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(false);
    }, 10000); // 10 segundos
    return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
  }, [showNotification]); // Dependencia para reiniciar el temporizador

  const columns: Column<CustomerCreditNote>[] = React.useMemo(
    () => [
      {
        Header: "Nombre",
        accessor: "customer_name",
      },
      {
        Header: "Monto de crédito",
        accessor: "total_amount",
      },
      {
        Header: "Fecha de crédito",
        accessor: "credit_note_date",
        Cell: ({ value }) => {
          // Formatear la fecha al estilo "dd-MM-yyyy"
          return value
            ? format(new Date(value + "T00:00:00"), "dd-MM-yyyy", {
                locale: es,
              })
            : "";
        },
      },
      {
        Header: "Acciones",
        Cell: ({ row }) => (
          <div className="flex justify-center space-x-2">
            <button
              title="Editar nota de crédito"
              aria-label="Editar nota de crédito"
              onClick={() => {
                const dateString = row.original.credit_note_date;
                const dateObj =
                  dateString.length === 10
                    ? new Date(dateString.toString() + "T00:00:00")
                    : new Date(dateString.toString());
                setTypeRequest("update");
                setEditRowId(row.original.sale_id.toString());
                setIsModalOpenCn(true);
                setFormDataCn({
                  id: row.original.sale_id.toString(),
                  creditNoteAmount: row.original.total_amount.toString(),
                  creditNoteDate: dateObj,
                  creditNoteDetail: row.original.credit_note_detail,
                });
                setCustomerName(row.original.customer_name);
                setCustomerId(Number(row.original.customer_id));
              }}
              className="text-primary"
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
              title="Eliminar nota de crédito"
              aria-label="Eliminar nota de crédito"
              onClick={() => handleRemoveCn(row.original.sale_id)}
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
          </div>
        ),
      },
    ],
    []
  );
  const buttonText = typeRequest === "create" ? "Guardar" : "Actualizar";

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    nextPage,
    previousPage,
    state: { pageIndex, pageSize },
    setPageSize,
    gotoPage, // <-- agrega esto
  } = useTable(
    {
      columns,
      data: customers,
      manualSortBy: true,
      disableMultiSort: true,
      pageCount: -1,
      manualPagination: false,
      autoResetPage: false,
    },
    useSortBy,
    usePagination
  );
  const handleAddCn = (customer: Customer) => {
    Swal.fire({
      title:
        "¿Desea agregar nota de crédito al cliente: " + customer.name + "?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#72cb10",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, agregar!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsModalOpenCustomer(false);
        setIsModalOpenCn(true);
        setCustomerName(customer.name);
        setCustomerId(customer.id);
      }
    });
  };

  const handleInputChangeCn = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormDataCn({
      ...formDataCn,
      [name]: value,
    });

    // Validación en tiempo real del monto de la nota de crédito
    if (name === "creditNoteAmount") {
      const regex = /^[0-9]*\.?[0-9]*$/;
      if (regex.test(value)) {
        setFormDataCn({ ...formDataCn, [name]: value });
        setErrors({ ...errors, amontError: null }); // <-- Limpia el error si es válido
      } else {
        setErrors({
          ...errors,
          amontError:
            value !== errors.amontError
              ? "El monto debe ser un número válido"
              : errors.amontError,
        });
        setErrorMessage("Validar Precio");
        setShowNotification(true);
      }
    }
  };

  const handleSubmitCn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setShowSpinner(true);
      const session = await getSession();
      // Format the creditNoteDate as "yyyy-MM-dd"
      const formattedCreditNoteDate = formDataCn.creditNoteDate
        ? new Date(formDataCn.creditNoteDate).toISOString().slice(0, 10)
        : "";
      if (typeRequest === "create") {
        const response = await creditCustomerRegister(
          session?.user.token as string,
          customerId as number,
          Number(formDataCn.creditNoteAmount),
          formattedCreditNoteDate,
          formDataCn.creditNoteDetail,
          session?.user.company_id as string
        );

        if (response) {
          gotoPage(0);
          setCustomers((prevCustomers) => [
            {
              sale_id: response.data.id,
              customer_id: customerId as number,
              customer_name: customerName,
              total_amount: Number(formDataCn.creditNoteAmount),
              credit_note_date: formattedCreditNoteDate,
              credit_note_detail: formDataCn.creditNoteDetail,
            },
            ...prevCustomers,
          ]);

          // Reiniciar el formulario
          setFormDataCn({
            id: "",
            creditNoteAmount: "",
            creditNoteDate: "",
            creditNoteDetail: "",
          });

          setIsModalOpenCn(false);
          setShowNotification(true);
          setTypeMessage("success");
          setErrorMessage("El registro fue agregado exitosamente");
        }
      } else {
        // Actualizar nota de crédito existente
        gotoPage(pageIndex + 1); // Asegurarse de que la página actual sea la correcta
        const response = await updateCreditNote(
          session?.user.token as string,
          formDataCn.id as number,
          Number(formDataCn.creditNoteAmount),
          formattedCreditNoteDate,
          formDataCn.creditNoteDetail as string
        );
        if (response) {
          // Actualizar el registro en el estado
          setCustomers((prevCustomers) =>
            prevCustomers.map((customer) =>
              customer.sale_id === Number(formDataCn.id)
                ? {
                    ...customer,
                    total_amount: Number(formDataCn.creditNoteAmount),
                    credit_note_date: formattedCreditNoteDate,
                    credit_note_detail: formDataCn.creditNoteDetail,
                  }
                : customer
            )
          );

          // Reiniciar el formulario
          setFormDataCn({
            id: "",
            creditNoteAmount: "",
            creditNoteDate: "",
            creditNoteDetail: "",
          });

          setIsModalOpenCn(false);
          setShowNotification(true);
          setTypeMessage("success");
          setErrorMessage("El registro fue actualizado exitosamente");
        }
      }
    } catch (errors) {
      console.error("Error actualizando o guardando registro:", errors);
      setShowNotification(true);
      setTypeMessage("error");
      setErrorMessage("Error actualizando o guardando registro");
    } finally {
      setShowSpinner(false);
    }
  };

  const handleRemoveCn = async (id: number) => {
    Swal.fire({
      title: `¿Desea eliminar la nota de crédito?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#72cb10",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setShowSpinner(true);
          const session = await getSession();
          const response = await removeCreditNote(
            session?.user.token as string,
            id as number
          );
          if (response) {
            // Filtrar la nota de crédito eliminada
            setCustomers((prevCustomers) =>
              prevCustomers.filter((customer) => customer.sale_id !== id)
            );
            setShowNotification(true);
            setTypeMessage("success");
            setErrorMessage("Nota de crédito eliminada exitosamente");
          }
        } catch (error) {
          console.error("Error eliminando nota de crédito:", error);
          setShowNotification(true);
          setTypeMessage("error");
          setErrorMessage("Error eliminando nota de crédito");
        } finally {
          setShowSpinner(false);
        }
      }
    });
  };

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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Nota de Crédito</h1>
      </div>
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
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                title="Agregar nota de crédito"
                onClick={() => {
                  setTypeRequest("create");
                  setFormDataCn({
                    id: "",
                    creditNoteAmount: "",
                    creditNoteDate: "",
                    creditNoteDetail: "",
                  });
                  setIsModalOpenCustomer(true);
                }}
                className="px-4 py-2 bg-primary text-white rounded-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="size-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5a.75.75 0 0 1 1.5 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
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
                      String(row.original.sale_id) === editRowId
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
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="block md:hidden mt-2 space-y-4">
        {page.map((row) => {
          const customer = row.original;
          return (
            <div
              key={Number(customer.sale_id)}
              className="p-4 bg-white rounded-lg shadow border border-gray-300"
            >
              <p>
                <span className="font-semibold">Nombre:</span>{" "}
                {customer.customer_name}
                <hr />
                <span className="font-semibold">Monto:</span>{" "}
                {Number(customer.total_amount)}
                <hr />
                <span className="font-semibold">Fecha:</span>{" "}
                {customer.credit_note_date}
                <hr />
              </p>

              <div className="mt-2 flex justify-end space-x-2">
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => {
                    const dateString = customer.credit_note_date;
                    const dateObj =
                      dateString.length === 10
                        ? new Date(dateString.toString() + "T00:00:00")
                        : new Date(dateString.toString());
                    setTypeRequest("update");
                    setEditRowId(customer.sale_id.toString());
                    setIsModalOpenCn(true);
                    setFormDataCn({
                      id: customer.sale_id.toString(),
                      creditNoteAmount: customer.total_amount.toString(),
                      creditNoteDate: dateObj,
                      creditNoteDetail: customer.credit_note_detail,
                    });
                    setCustomerName(customer.customer_name);
                    setCustomerId(Number(customer.customer_id));
                  }}
                >
                  Editar
                </button>
                <button
                  className="text-red-600 hover:underline"
                  onClick={() => handleRemoveCn(customer.sale_id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
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
        isOpen={isModalOpenCustomer}
        onClose={() => setIsModalOpenCustomer(false)}
        title={"Agregar Nota de crédito"}
      >
        <div className="overflow-x-auto">
          <div>
            <input
              type="text"
              placeholder="Buscar por nombre o ID"
              className="block w-full rounded-md border py-1.5 mb-4"
              onChange={(e) => {
                const searchTerm = e.target.value.toLowerCase();
                setCustomersData(
                  customersDataAux.filter(
                    (customer) =>
                      customer.name.toLowerCase().includes(searchTerm) ||
                      String(customer.client_id)
                        .toLowerCase()
                        .includes(searchTerm)
                  )
                );
              }}
            />
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customersData.length > 0 ? (
                customersData.map((customer) => (
                  <React.Fragment key={customer.id}>
                    <tr key={customer.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {customer.client_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {customer.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleAddCn(customer)}
                          className="text-primary"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            className="size-4"
                          >
                            <path d="M6.621 6.584c.208-.026.418-.046.629-.06v1.034l-.598-.138a.227.227 0 0 1-.116-.065.094.094 0 0 1-.028-.06 5.345 5.345 0 0 1 .002-.616.082.082 0 0 1 .025-.055.144.144 0 0 1 .086-.04ZM8.75 10.475V9.443l.594.137a.227.227 0 0 1 .116.065.094.094 0 0 1 .028.06 5.355 5.355 0 0 1-.002.616.082.082 0 0 1-.025.055.144.144 0 0 1-.086.04c-.207.026-.415.045-.625.06Z" />
                            <path
                              fillRule="evenodd"
                              d="M2.5 3.5A1.5 1.5 0 0 1 4 2h4.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12a1.5 1.5 0 0 1 .439 1.061V12.5A1.5 1.5 0 0 1 12 14H4a1.5 1.5 0 0 1-1.5-1.5v-9Zm6.25 1.25a.75.75 0 0 0-1.5 0v.272c-.273.016-.543.04-.81.073-.748.09-1.38.689-1.428 1.494a6.836 6.836 0 0 0-.002.789c.044.785.635 1.348 1.305 1.503l.935.216v1.379a11.27 11.27 0 0 1-1.36-.173.75.75 0 1 0-.28 1.474c.536.102 1.084.17 1.64.202v.271a.75.75 0 0 0 1.5 0v-.272c.271-.016.54-.04.807-.073.747-.09 1.378-.689 1.427-1.494a6.843 6.843 0 0 0 .002-.789c-.044-.785-.635-1.348-1.305-1.503l-.931-.215v-1.38c.46.03.913.089 1.356.173a.75.75 0 0 0 .28-1.474 12.767 12.767 0 0 0-1.636-.201V4.75Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-4">
                    No hay clientes disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <button
          onClick={() => setIsModalOpenCustomer(false)}
          className="mt-4 w-full rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white"
        >
          Cerrar
        </button>
      </Modal>
      <Modal
        isOpen={isModalOpenCn}
        onClose={() => setIsModalOpenCn(false)}
        title={"Agregar Nota de crédito, Cliente: " + customerName}
      >
        <form onSubmit={handleSubmitCn} className="text-primary-contrast">
          <div className="grid gap-6 mb-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="creditNoteAmount"
                className="block mb-2 text-sm font-medium dark:text-white"
              >
                Monto de Nota de Crédito
              </label>
              <input
                id="creditNoteAmount"
                name="creditNoteAmount"
                onChange={handleInputChangeCn}
                value={formDataCn.creditNoteAmount}
                placeholder="Monto de Nota de Crédito"
                type="text"
                required
                className="block w-full rounded-md border py-1.5"
              />
              {errors.amontError && (
                <p className="text-red-500 text-sm mt-1">{errors.amontError}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="creditNoteDate"
                className="block mb-2 text-sm font-medium"
              >
                Fecha de Nota de Crédito
              </label>
              <ReactDatePicker
                dateFormat="dd-MM-yyyy"
                selected={
                  formDataCn.creditNoteDate
                    ? new Date(formDataCn.creditNoteDate)
                    : null
                }
                onChange={(date: Date | null) => {
                  setFormDataCn({
                    ...formDataCn,
                    creditNoteDate: date ? date.toISOString() : "",
                  });
                }}
                locale={es}
                className="block w-full rounded-md border py-1.5"
                placeholderText="Selecciona una fecha"
                required
              />
            </div>
          </div>
          <div className="grid gap-6 mb-6 md:grid-cols-1 text-primary-contrast">
            <div>
              <label
                htmlFor="creditNoteDetail"
                className="block mb-2 text-sm font-medium"
              >
                Detalle
              </label>
              <textarea
                id="creditNoteDetail"
                name="creditNoteDetail"
                onChange={handleInputChangeCn}
                value={formDataCn.creditNoteDetail}
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
            disabled={
              !formDataCn.creditNoteAmount || errors.amontError !== null
            }
          >
            {buttonText}
          </button>
        </form>
      </Modal>
    </div>
  );
};
export default CreditNotePage;
