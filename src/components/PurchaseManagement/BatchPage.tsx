"use client";
import Spinner from "../Common/Spinner/SpinnerPage";
import React, { useEffect, useState } from "react";
import { Batch, Company } from "@/types/type";
import { getSession } from "next-auth/react";
import {
  fetchBatchesList,
  registerBatch,
  deleteBatch,
  updateBatch,
} from "@/app/api/purchase/api"; // Asegúrate de que la ruta sea correcta
import Modal from "../Common/Modal/ModalPage";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Notification from "../Common/Notification/NotificationPage";
import Swal from "sweetalert2";
import { useTable, usePagination, Column, useSortBy } from "react-table";
import InfoCardGrid from "../Common/Card/InfoCardGrid";
import { fetchCompaniesList } from "@/app/api/admin/api";

const BatchPage = () => {
  const [showSpinner, setShowSpinner] = useState(false);
  const [batchs, setBatchs] = useState<Batch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: "",
    status: "created",
    order_creation_date: new Date(),
  });
  const [showNotification, setShowNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [typeMessage, setTypeMessage] = useState("success");
  const [isEditing, setIsEditing] = useState(false); // Nuevo estado
  const [editingBatchId, setEditingBatchId] = useState<number | null>(null); // ID del lote en edición

  useEffect(() => {
    const fetchBatch = async () => {
      setShowSpinner(true);
      const session = await getSession();
      const token = session?.user.token as string;
      const ownCompanyId = session?.user.company_id || null;

      setCompanyId(ownCompanyId);

      try {
        if (ownCompanyId) {
          const response = await fetchBatchesList(token, ownCompanyId);
          setBatchs(response);
        } else {
          const companyData = await fetchCompaniesList(token);
          setCompanies(companyData);
          setBatchs([]);
        }
      } catch (error) {
        console.error("Error fetching batch data:", error);
      } finally {
        setShowSpinner(false);
      }
    };
    fetchBatch();
  }, []);

  const activeCompanyId = companyId || selectedCompanyId || null;

  const handleCompanyChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const nextCompanyId = e.target.value;
    setSelectedCompanyId(nextCompanyId);
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingBatchId(null);

    if (!nextCompanyId) {
      setBatchs([]);
      return;
    }

    const session = await getSession();
    try {
      setShowSpinner(true);
      const response = await fetchBatchesList(
        session?.user.token as string,
        nextCompanyId
      );
      setBatchs(response);
    } catch (error) {
      console.error("Error fetching company batches:", error);
      setShowNotification(true);
      setErrorMessage("Error cargando lotes de la empresa");
      setTypeMessage("error");
    } finally {
      setShowSpinner(false);
    }
  };

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 10000); // 10 segundos

      return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
    }
  }, [showNotification]);

  const columns: Column<Batch>[] = React.useMemo(
    () => [
      {
        Header: "Nombre",
        accessor: "name",
      },
      {
        Header: "Descripción",
        accessor: "description",
      },
      {
        Header: "Cantidad",
        accessor: "quantity",
      },
      {
        Header: "Estatus",
        accessor: "status",
        Cell: ({ value }) => (
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              value === "received"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        ),
      },
      {
        Header: "Fecha de Orden",
        accessor: "order_creation_date",
        Cell: ({ value }) => format(new Date(value), "dd-MM-yyyy"), // Formatear la fecha
      },
      {
        Header: "Acciones",
        Cell: ({ row }) => (
          <div className="flex justify-center space-x-2">
            <button
              className="text-primary"
              onClick={() => handleEditClick(row.original)}
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
              className="text-primary"
              onClick={() => handleDelete(row.original.id)}
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
      data: batchs,
      initialState: { pageIndex: 0, pageSize: 10 }, // Mostrar 10 registros por página
    },
    useSortBy, // Agregar el plugin de ordenación
    usePagination // Agregar el plugin de paginación
  );

  const handleEditClick = (batch: Batch) => {
    setFormData({
      name: batch.name,
      description: batch.description,
      quantity: String(batch.quantity),
      status: batch.status,
      order_creation_date: new Date(batch.order_creation_date),
    });
    setEditingBatchId(batch.id); // Guardar el ID del lote en edición
    setIsEditing(true); // Cambiar a modo edición
    setIsModalOpen(true); // Abrir el modal
  };

  const handleDelete = async (id: number) => {
    Swal.fire({
      title: "¿Estás seguro de que deseas eliminar este lote?",
      text: "No podrás revertir esto.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#72cb10",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminarlo!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const session = await getSession();
        if (!activeCompanyId) {
          setShowNotification(true);
          setErrorMessage("Selecciona una empresa antes de eliminar");
          setTypeMessage("error");
          return;
        }
        const response = await deleteBatch(
          session?.user.token as string,
          id,
          activeCompanyId
        );
        if (response === 200) {
          setShowNotification(true);
          setErrorMessage("Punto de venta eliminado correctamente");
          setTypeMessage("success");
          setBatchs((prevBatch) =>
            prevBatch.filter((batch) => batch.id !== id)
          );
        } else {
          setShowNotification(true);
          setErrorMessage("Error al eliminar el punto de venta");
          setTypeMessage("error");
        }
      }
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSaveBatch = async () => {
    setShowSpinner(true);
    setIsModalOpen(false);
    const session = await getSession();
    if (!activeCompanyId) {
      setShowNotification(true);
      setErrorMessage("Selecciona una empresa antes de guardar");
      setTypeMessage("error");
      setShowSpinner(false);
      return;
    }
    try {
      if (isEditing && editingBatchId !== null) {
        // Actualizar lote existente
        const response = await updateBatch(
          session?.user.token as string,
          editingBatchId,
          formData.name,
          formData.description,
          parseInt(formData.quantity, 10),
          formData.status,
          format(formData.order_creation_date, "yyyy-MM-dd"),
        activeCompanyId
        );
        if (response) {
          setBatchs((prevBatch) =>
            prevBatch.map((batch) =>
              batch.id === editingBatchId
                ? {
                    ...batch,
                    name: formData.name,
                    description: formData.description,
                    quantity: parseInt(formData.quantity, 10),
                    status: formData.status,
                    order_creation_date: format(
                      formData.order_creation_date,
                      "yyyy-MM-dd"
                    ),
                  }
                : batch
            )
          );
          setShowNotification(true);
          setErrorMessage("Lote actualizado correctamente");
          setTypeMessage("success");
        }
      } else {
        // Crear nuevo lote
        const response = await registerBatch(
          session?.user.token as string,
          formData.name,
          formData.description,
          parseInt(formData.quantity, 10),
          formData.status,
          format(formData.order_creation_date, "yyyy-MM-dd"),
        activeCompanyId
        );
        if (response) {
          setBatchs((prevBatch) => [
            ...prevBatch,
            {
              id: response.id,
              name: formData.name,
              description: formData.description,
              quantity: parseInt(formData.quantity, 10),
              status: formData.status,
              order_creation_date: format(
                formData.order_creation_date,
                "yyyy-MM-dd"
              ),
            },
          ]);
          setShowNotification(true);
          setErrorMessage("Lote creado correctamente");
          setTypeMessage("success");
        }
      }
      handleSetInputs(true); // Limpiar los campos del formulario
    } catch (error) {
      console.error("Error al guardar el lote:", error);
      setShowNotification(true);
      const errorMessage =
        (error as any)?.response?.data?.message || "Error desconocido";
      setErrorMessage(`${errorMessage}`);
      setTypeMessage("error");
    } finally {
      setShowSpinner(false);
      setIsModalOpen(false);
      setIsEditing(false); // Restablecer el modo edición
      setEditingBatchId(null); // Limpiar el ID del lote en edición
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData((prevData) => ({
        ...prevData,
        order_creation_date: date, // Actualizar la fecha seleccionada
      }));
    }
  };

  const handleSetInputs = (status: boolean) => {
    if (status) {
      setFormData({
        name: "",
        description: "",
        quantity: "",
        status: "created",
        order_creation_date: new Date(),
      });
    }
  };

  const handleAddBatch = () => {
    setFormData({
      name: "",
      description: "",
      quantity: "",
      status: "created",
      order_creation_date: new Date(),
    });
    setIsModalOpen(true);
    handleSetInputs(false); // Limpiar los campos del formulario
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
      {!companyId && (
        <div className="mt-4 text-primary-contrast">
          <label
            htmlFor="batch_company_id"
            className="block mb-2 text-sm font-medium"
          >
            Empresa
          </label>
          <select
            id="batch_company_id"
            value={selectedCompanyId}
            onChange={handleCompanyChange}
            className="border rounded p-2 w-full md:w-80"
          >
            <option value="">Selecciona una empresa</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      )}

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
              id="add_user"
              type="button"
              onClick={() => {
                handleAddBatch();
              }}
              disabled={!activeCompanyId}
              title={!activeCompanyId ? "Selecciona una empresa" : "Agregar lote"}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                />
              </svg>
            </button>
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
        {batchs?.map((batch) => (
          <div
            key={batch.id}
            className="p-4 bg-white rounded-lg shadow border border-gray-300"
          >
            <p>
              <span className="font-semibold">Nombre:</span> {batch.name}
            </p>
            <p>
              <span className="font-semibold">Descripción:</span>{" "}
              {batch.description}
            </p>
            <p>
              <span className="font-semibold">Cantidad:</span> {batch.quantity}
            </p>
            <p>
              <span className="font-semibold">Fecha de Orden:</span>{" "}
              {batch.order_creation_date}
            </p>
            <div className="mt-2 flex justify-end space-x-2">
              <button
                onClick={() => handleEditClick(batch)}
                className="text-blue-600 hover:underline"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(batch.id)}
                className="text-red-600 hover:underline"
              >
                Eliminar
              </button>
            </div>
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
        title={isEditing ? "Editar Lote" : "Agregar Lote"} // Cambiar el título dinámicamente
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsEditing(false); // Restablecer el modo edición al cerrar
          setEditingBatchId(null); // Limpiar el ID del lote en edición
        }}
      >
        <div className="max-w-md mx-auto text-primary-contrast">
          <div className="relative">
            <div className="mb-6">
              <label htmlFor="name" className="mb-2 text-sm font-medium">
                Nombre Lote
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="block w-full rounded-md border py-1.5"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="description"
                className="block mb-2 text-sm font-medium"
              >
                Descripción
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="quantity"
                className="block mb-2 text-sm font-medium"
              >
                Cantidad
              </label>
              <input
                type="text"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="status"
                className="block mb-2 text-sm font-medium"
              >
                Estatus
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              >
                <option value="created">Creado</option>
                <option value="received">Recibido</option>
              </select>
            </div>
            <div className="mb-6">
              <label
                htmlFor="order_creation_date"
                className="block mb-2 text-sm font-medium"
              >
                Fecha de Orden
              </label>
              <ReactDatePicker
                selected={formData.order_creation_date}
                onChange={handleDateChange}
                dateFormat="dd- MM-yyyy"
                locale={es}
                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSaveBatch}
              className="w-full p-2 bg-primary text-white rounded-lg"
            >
              <span>Guardar</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BatchPage;
