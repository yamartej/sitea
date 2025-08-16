"use client";
import { useEffect, useState } from "react";
import {
  deleteWarehouses,
  fetchWarehousesList,
  fetchWarehousesListByCompany,
  registerWarehouse,
  updateWarehouse,
} from "@/app/api/inventory/api";
import { getSession } from "next-auth/react";
import { Company, Warehouse } from "@/types/type";
import Notification from "../Common/Notification/NotificationPage";
import Spinner from "../Common/Spinner/SpinnerPage";
import Swal from "sweetalert2";
import React from "react";
import { useTable, usePagination, Column, useSortBy } from "react-table";
import Modal from "../Common/Modal/ModalPage";

const WharehousePage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showRegister, setShowRegister] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [btnAction, setBtnAction] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [typeMessage, setTypeMessage] = useState("error");
  const [typeRequest, setTypeRequest] = useState("create");
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    address: "",
    phone: "",
    company_id: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setShowSpinner(true);
    const fetchWarehouses = async () => {
      setShowSpinner(true);
      const session = await getSession();
      setCompanyId(session?.user.company_id || null);
      try {
        if (!session?.user.company_id) {
          const data = await fetchWarehousesList(session?.user.token as string);
          setWarehouses(data);
          const allCompanies = data.map((item: Warehouse) => item.company);
          console.log("allCompanies=", allCompanies);
          const companies = Array.from(
            new Map(
              allCompanies.map((company: Company) => [company.id, company])
            ).values()
          ) as Company[];
          console.log("companies=", companies);
          setCompanies(companies);
        } else {
          const data = await fetchWarehousesListByCompany(
            session?.user.company_id as string,
            session?.user.token as string
          );

          setWarehouses(data);
        }
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
    fetchWarehouses();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(false);
    }, 10000); // 10 segundos

    return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
  }, [showNotification]); // Dependencia para reiniciar el temporizador

  const columns: Column<Warehouse>[] = React.useMemo(
    () => [
      {
        Header: "Empresa",
        accessor: "company",
        Cell: ({ value }: { value: Company }) => (
          <div>{value?.name || "No asignado"}</div>
        ),
      },
      {
        Header: "Nombre",
        accessor: "name",
      },
      {
        Header: "Descripción",
        accessor: "description",
      },
      {
        Header: "Dirección",
        accessor: "address",
      },
      {
        Header: "Acciones",
        Cell: ({ row }) => (
          <div className="flex space-x-2">
            <button
              className="text-primary hover:underline"
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
              className="text-primary hover:underline"
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
    [warehouses]
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
      data: warehouses,
      initialState: { pageIndex: 0, pageSize: 10 }, // Mostrar 10 registros por página
    },
    useSortBy, // Agregar el plugin de ordenación
    usePagination // Agregar el plugin de paginación
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsModalOpen(false);
    try {
      setShowSpinner(true);
      const session = await getSession();
      if (typeRequest === "create") {
        if (typeRequest === "create") {
          const response = await registerWarehouse(
            session?.user.token as any,
            formData.name,
            formData.description,
            formData.address,
            Number(session?.user.company_id)
          );
          if (response) {
            const newWarehouse: Warehouse = {
              id: response.id,
              name: response.name,
              description: response.description,
              address: response.address,
              company: response.company,
              phone: "",
            };
            setWarehouses([...warehouses, newWarehouse]);
            setShowNotification(true);
            setTypeMessage("success");
            setErrorMessage("El registro fue agregado exitosamente");
            setShowSpinner(false);
            cleanInputs();
          }
        }
      } else {
        const response = await updateWarehouse(
          session?.user.token as any,
          Number(formData.id),
          formData.name,
          formData.description,
          formData.address,
          Number(formData.phone),
          session?.user.company_id as string
        );
        if (response) {
          // Actualizar el estado de los almacenes con el nuevo registro
          const updatedWarehouses = warehouses.map((warehouse) => {
            if (warehouse.id === Number(formData.id)) {
              return {
                ...warehouse,
                ...formData,
                id: Number(formData.id), // Ensure id is a number
              };
            }
            return warehouse;
          });

          setWarehouses(updatedWarehouses);

          setShowNotification(true);
          setTypeMessage("success");
          setErrorMessage("El registro fue actualizado satisfactoriamente");
          setShowSpinner(false);
          cleanInputs();
        }
      }
    } catch (errors) {
      console.error("Error actualizando o guardando registro:", errors);
      setShowNotification(true);
      setTypeMessage("error");
      setErrorMessage("Error actualizando o guardando registro");
      setShowSpinner(false);
    } finally {
      if (showNotification) {
        const timer = setTimeout(() => {
          setShowNotification(false);
        }, 10000); // 10 segundos
        return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
      }
    }
  };
  const cleanInputs = () => {
    formData.name = "";
    formData.address = "";
    formData.description = "";
  };
  const handleEditClick = (warehouse: Warehouse) => {
    setFormData({
      name: warehouse.name,
      id: warehouse.id.toString(),
      address: warehouse.address,
      description: warehouse.description,
      phone: warehouse.phone || "", // Add phone property with a default value
      company_id: warehouse.company?.id ? String(warehouse.company.id) : "", // Add company_id property with a default value
    });
    setIsModalOpen(true);
    setTypeRequest("update");
  };

  const handleDelete = async (id: number) => {
    try {
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "No podrás revertir esto.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#72cb10",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminarlo!",
      });

      if (result.isConfirmed) {
        setShowSpinner(true);
        const session = await getSession();
        const response = await deleteWarehouses(
          session?.user.token as string,
          id
        );

        if (response === 204) {
          // Filtrar los datos eliminando el registro
          setWarehouses((prevWarehouses) => {
            const updatedWarehouses = prevWarehouses.filter(
              (warehouse) => warehouse.id !== id
            );
            return updatedWarehouses;
          });

          // Mostrar notificación de éxito
          setShowNotification(true);
          setTypeMessage("success");
          setErrorMessage("El registro fue eliminado exitosamente");
          setShowSpinner(false);
        }
      }
    } catch (error) {
      console.error("Error al eliminar el registro:", error);
      setShowNotification(true);
      setTypeMessage("error");
      setErrorMessage("Error al eliminar el registro");
      setShowSpinner(false);
    } finally {
      if (showNotification) {
        const timer = setTimeout(() => {
          setShowNotification(false);
        }, 10000); // 10 segundos
        return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
      }
    }
  };
  // Determinar el texto del botón basado en el estado
  const buttonText = typeRequest === "create" ? "Guardar" : "Actualizar";

  const handleAddWarehouse = () => {
    setIsModalOpen(true);
    setTypeRequest("create");
    cleanInputs();
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

          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              id="add_user"
              type="button"
              onClick={() => {
                handleAddWarehouse();
              }}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5"
              >
                <path d="M2.879 7.121A3 3 0 0 0 7.5 6.66a2.997 2.997 0 0 0 2.5 1.34 2.997 2.997 0 0 0 2.5-1.34 3 3 0 1 0 4.622-3.78l-.293-.293A2 2 0 0 0 15.415 2H4.585a2 2 0 0 0-1.414.586l-.292.292a3 3 0 0 0 0 4.243ZM3 9.032a4.507 4.507 0 0 0 4.5-.29A4.48 4.48 0 0 0 10 9.5a4.48 4.48 0 0 0 2.5-.758 4.507 4.507 0 0 0 4.5.29V16.5h.25a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75v-3.5a.75.75 0 0 0-.75-.75h-2.5a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1 0-1.5H3V9.032Z" />
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
              // Correcto: se extrae la 'key' y se pasa explícitamente
              const { key, ...restHeaderGroupProps } =
                headerGroup.getHeaderGroupProps();
              return (
                <tr key={key} {...restHeaderGroupProps}>
                  {headerGroup.headers.map((column) => {
                    // Correcto: se extrae la 'key' y se pasa explícitamente
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
              // CORRECCIÓN: Extraemos la 'key' y la pasamos directamente al <tr>
              const { key, ...restRowProps } = row.getRowProps();
              return (
                <tr
                  key={key}
                  {...restRowProps}
                  className="odd:bg-white bg-gray-100 hover:bg-gray-100 transition"
                >
                  {row.cells.map((cell) => {
                    // CORRECCIÓN: Extraemos la 'key' y la pasamos directamente al <td>
                    const { key, ...restCellProps } = cell.getCellProps();
                    return (
                      <td key={key} {...restCellProps} className="px-4 py-2">
                        {cell.render("Cell")}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="block md:hidden mt-2 space-y-4">
        {warehouses?.map((warehouse) => (
          <div
            key={warehouse.id}
            className="p-4 bg-white rounded-lg shadow border border-gray-300"
          >
            <p>
              <span className="font-semibold">Nombre:</span> {warehouse.name}
              <hr />
              <span className="font-semibold">Descripción:</span>{" "}
              {warehouse.description}
              <hr />
              <span className="font-semibold">Dirección:</span>{" "}
              {warehouse.address}
              <hr />
            </p>
            <div className="mt-2 flex justify-end space-x-2">
              <button
                onClick={() => handleEditClick(warehouse)}
                className="text-blue-600 hover:underline"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(warehouse.id)}
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          typeRequest === "create" ? "Registrar Almacen" : "Actualizar Almacen"
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 mb-6 md:grid-cols-2 text-primary-contrast">
            {!companyId && (
              <div className="mb-6">
                <label
                  htmlFor="company_id"
                  className="block mb-2 text-sm font-medium"
                >
                  Empresa
                </label>
                <select
                  id="company_id"
                  name="company_id"
                  value={formData.company_id}
                  onChange={handleInputChange}
                  className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  required
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
              <label htmlFor="name" className="block mb-2 text-sm font-medium">
                Nombre
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="block w-full rounded-md border py-1.5"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block mb-2 text-sm font-medium"
              >
                Descripcion
              </label>
              <input
                id="description"
                name="description"
                type="text"
                value={formData.description}
                onChange={handleInputChange}
                required
                className="block w-full rounded-md border py-1.5"
              />
            </div>
            <div>
              <label
                htmlFor="address"
                className="block mb-2 text-sm font-medium"
              >
                Dirección
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleInputChange}
                className="block w-full rounded-md border py-1.5"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white"
            disabled={!!btnAction}
          >
            {buttonText}
          </button>
        </form>
      </Modal>
    </>
  );
};

export default WharehousePage;
