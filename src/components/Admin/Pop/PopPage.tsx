"use client";
import React, { use } from "react";
import Modal from "@/components/Common/Modal/ModalPage";
import { useEffect, useState } from "react";
import {
  fetchPops,
  registerPop,
  fetchPopsList,
  updatePop,
  deletePop,
  fetchUsersListByCompany,
  getUsersByRole,
  fetchPopStatus,
  registerPopStatus,
  deletePopStatus,
  closePopStatus,
  fetchUsersList,
} from "@/app/api/admin/api";
import { getSession } from "next-auth/react";
import { Pop, Company } from "@/types/type";
import Spinner from "@/components/Common/Spinner/SpinnerPage";
import Notification from "@/components/Common/Notification/NotificationPage";
import swal from "sweetalert2";
import { useTable, usePagination, Column, useSortBy } from "react-table";
import { Console } from "console";

const PopPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [pops, setPops] = useState<Pop[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showSpinner, setShowSpinner] = useState(false);
  const [typeRequest, setTypeRequest] = useState("add");
  const [showNotification, setShowNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [typeMessage, setTypeMessage] = useState("error");
  const [sellerData, setSellerData] = useState<
    {
      id: number;
      name: string;
    }[]
  >([]);

  const [formData, setFormData] = useState({
    id: "",
    identifier: "",
    ubication: "",
    status: "",
    seller: "",
    seller_id: "",
    date: "",
    company_id: "",
  });

  useEffect(() => {
    setShowSpinner(true);
    const fetchPopList = async () => {
      try {
        const session = await getSession();
        setCompanyId(session?.user.company_id || null);
        if (session?.user.company_id === null) {
          const data = await fetchPops(session?.user.token as any);
          const usersData = await fetchUsersList(session?.user.token as any);
          setPops(data);
          const companiesFromUsers = usersData
            .filter((user: any) => user.company)
            .map((user: any) => user.company);
          setCompanies(companiesFromUsers);
        } else {
          const data = await fetchPopsList(
            session?.user.token as any,
            session?.user.company_id as string
          );
          setPops(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setShowSpinner(false);
      }
    };
    fetchPopList();
  }, []);

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 10000); // 10 segundos

      return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
    }
  }, [showNotification]);

  useEffect(() => {
    if (typeRequest === "add") {
      //actualizar formData.status sea igual a "created"
      setFormData({
        ...formData,
        status: "created",
      });
    }
  }, [isModalOpen]);

  const handleAddPop = async () => {
    try {
      setShowSpinner(true);
      const session = await getSession();

      const response = await registerPop(
        session?.user.token as any,
        formData.identifier,
        formData.ubication,
        formData.status,
        formData.seller,
        formData.company_id
          ? formData.company_id
          : (session?.user.company_id as string)
      );
      if (response) {
        const newPop: Pop = {
          id: response.id,
          identifier: formData.identifier,
          ubication: formData.ubication,
          status: formData.status,
          updated_at: new Date().toISOString(),
          name: "",
          address: "",
          seller: "",
          seller_id: "",
          company_id: "",
          company: {
            id: response.company_id,
            name: response.company.name || "No asignado",
          },
        };
        setPops([...pops, newPop]);
        setShowNotification(true);
        setErrorMessage("Punto de venta registrado correctamente");
        setTypeMessage("success");
      }
    } catch (error) {
      console.error(error);
      setShowNotification(true);
      setErrorMessage((error as any).response.data.message);
      setTypeMessage("error");
    } finally {
      setIsModalOpen(false);
      setShowSpinner(false);
      setTypeRequest("add");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleEditClick = (pop: Pop) => {
    setFormData({
      ...formData,
      id: pop.id.toString(),
      identifier: pop.identifier,
      ubication: pop.ubication,
      status: pop.status,
      seller: pop.seller || "",
      seller_id: pop.seller_id || "",
      company_id: pop.company_id,
    });
    setTypeRequest("edit");
    setIsModalOpen(true);
  };

  const handleEditPop = async () => {
    try {
      setIsModalOpen(false);
      setShowSpinner(true);
      const session = await getSession();
      const response = await updatePop(
        session?.user.token as any,
        Number(formData.id),
        formData.identifier,
        formData.ubication,
        formData.status,
        formData.seller_id
      );
      if (response.status === 200) {
        setPops(
          pops.map((pop) => {
            if (pop.id === Number(formData.id)) {
              return {
                ...pop,
                identifier: formData.identifier,
                ubication: formData.ubication,
              };
            }
            return pop;
          })
        );
        setShowNotification(true);
        setErrorMessage("Punto de venta actualizado correctamente");
        setTypeMessage("success");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setShowSpinner(false);
    }
  };

  const handleDelete = async (id: number) => {
    swal
      .fire({
        title: "¿Estás seguro?",
        text: "No podrás revertir esta acción",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#72cb10",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      })
      .then(async (result) => {
        if (result.isConfirmed) {
          try {
            setShowSpinner(true);
            if (formData.status == "open") {
              setShowNotification(true);
              setErrorMessage("No se puede eliminar un punto de venta abierto");
              setTypeMessage("error");
            } else {
              const session = await getSession();
              const response = await deletePop(session?.user.token as any, id);
              if (response === 200) {
                setPops((prevPops) => prevPops.filter((pop) => pop.id !== id));
                setShowNotification(true);
                setErrorMessage("Punto de venta eliminado correctamente");
                setTypeMessage("success");
              }
            }
          } catch (error) {
            console.error(error);
          } finally {
            setShowSpinner(false);
          }
        }
      });
  };

  const clearInputs = () => {
    setFormData({
      id: "",
      identifier: "",
      ubication: "",
      status: "",
      seller: "",
      seller_id: "",
      date: "",
      company_id: "",
    });
  };

  const handleSavePop = async () => {
    if (typeRequest === "add") {
      handleAddPop();
    } else if (typeRequest === "edit") {
      handleEditPop();
    } else if (typeRequest === "open") {
      handleOpenSavePop();
    }
  };

  const handleOpenClick = async (pop: Pop) => {
    setShowSpinner(true);
    const session = await getSession();
    const sellerData = await fetchUsersListByCompany(
      session?.user.token as any,
      pop.company_id as string
    );
    setSellerData(sellerData);
    setTypeRequest("open");
    setFormData({
      ...formData,
      id: pop.id.toString(),
      identifier: pop.identifier,
      ubication: pop.ubication,
      status: "open",
      seller: "",
      seller_id: "",
      company_id: pop.company_id,
    });

    setIsModalOpen(true);
    setShowSpinner(false);
  };

  const isSellerAssigned = (seller_id: string) => {
    return pops.some(
      (pop) => pop.status === "open" && pop.seller_id === seller_id
    );
  };

  const handleOpenSavePop = async () => {
    try {
      if (isSellerAssigned(formData.seller_id)) {
        setShowNotification(true);
        setErrorMessage("El vendedor ya tiene un punto de venta asignado");
        setTypeMessage("error");
        return;
      } else {
        setShowSpinner(true);
        const session = await getSession();
        const response = await updatePop(
          session?.user.token as any,
          Number(formData.id),
          formData.identifier,
          formData.ubication,
          formData.status,
          formData.seller_id
        );
        if (response.status === 200) {
          setPops(
            pops.map((pop) => {
              if (pop.id === Number(formData.id)) {
                return {
                  ...pop,
                  status: "open",
                  seller: response.data.seller,
                  seller_id: formData.seller_id,
                };
              }
              return pop;
            })
          );
          setShowNotification(true);
          setErrorMessage("Punto de venta abierto correctamente");
          setTypeMessage("success");
          setIsModalOpen(false);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setShowSpinner(false);
    }
  };

  const handleClosePop = async (pop: Pop) => {
    swal
      .fire({
        title: "¿Estás seguro de cerrar la caja?",
        text: "No podrás revertir esta acción",
        icon: "warning",
        confirmButtonColor: "#72cb10",
        cancelButtonColor: "#d33",
        showCancelButton: true,
        confirmButtonText: "Sí, cerrar",
        cancelButtonText: "Cancelar",
      })
      .then(async (result) => {
        if (result.isConfirmed) {
          try {
            setShowSpinner(true);
            const session = await getSession();
            const response = await updatePop(
              session?.user.token as any,
              pop.id,
              pop.identifier,
              pop.ubication,
              "closed",
              (pop.seller_id = "")
            );
            if (response.status === 200) {
              setPops((prevPops) =>
                prevPops.map((popInfo) =>
                  popInfo.id === response.data.id
                    ? {
                        ...popInfo,
                        status: "closed",
                        seller: "",
                        seller_id: "",
                      }
                    : popInfo
                )
              );
              setShowNotification(true);
              setErrorMessage("Punto de venta cerrado correctamente");
              setTypeMessage("success");
              clearInputs();
            }
          } catch (error) {
            console.error(error);
          } finally {
            setShowSpinner(false);
          }
        }
      });
  };

  const getStatusBgClass = (status: string) => {
    switch (status) {
      case "created":
        return "bg-yellow-500 text-black"; // Fondo amarillo, texto negro
      case "open":
        return "bg-green-500 text-white"; // Fondo verde, texto blanco
      case "closed":
        return "bg-blue-500 text-white"; // Fondo azul, texto blanco
      case "inactive":
        return "bg-gray-500 text-white"; // Fondo gris, texto blanco
      default:
        return "bg-gray-300 text-black"; // Fondo gris claro, texto negro
    }
  };

  const columns: Column<Pop>[] = React.useMemo(
    () => [
      {
        Header: "Empresa",
        accessor: "company",
        Cell: ({ value }: { value: Company }) => (
          <div>{value?.name || "No asignado"}</div>
        ),
      },
      {
        Header: "Identificador",
        accessor: "identifier",
      },
      {
        Header: "Ubicación",
        accessor: "ubication",
      },
      {
        Header: "Estado",
        accessor: "status",
        Cell: ({ value }: { value: string }) => (
          <span
            className={`px-2 py-1 rounded text-sm ${getStatusBgClass(value)}`}
          >
            {value === "created"
              ? "Creado"
              : value === "open"
              ? "Abierto"
              : value === "closed"
              ? "Cerrado"
              : "Desconocido"}
          </span>
        ),
      },
      {
        Header: "Vendedor",
        Cell: ({ row }: { row: any }) => (
          <div>{row.original.seller || "No asignado"}</div>
        ),
      },
      {
        Header: "Acciones",
        Cell: ({ row }: { row: any }) => (
          <div className="flex justify-center text-primary">
            <button onClick={() => handleEditClick(row.original)} className="">
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
              onClick={() => handleDelete(row.original.id)}
              className="ml-2"
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
            <button
              onClick={() => handleOpenClick(row.original)}
              className="ml-2"
              disabled={row.original.status === "open" ? true : false}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="size-4"
              >
                <path
                  fillRule="evenodd"
                  d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={() => handleClosePop(row.original)}
              className="ml-2"
              disabled={row.original.status === "closed" ? true : false}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="size-4"
              >
                <path
                  fillRule="evenodd"
                  d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z"
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
  } = useTable(
    {
      columns,
      data: pops,
      initialState: { pageIndex: 0, pageSize: 10 }, // Mostrar 10 registros por página
    },
    useSortBy, // Agregar el plugin de ordenación
    usePagination // Agregar el plugin de paginación
  );

  return (
    <div>
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
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                id="add_user"
                type="button"
                onClick={() => {
                  setIsModalOpen(true);
                  setTypeRequest("add");
                  clearInputs();
                }}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="size-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.75 3A1.75 1.75 0 0 0 2 4.75v10.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0 0 18 15.25v-8.5A1.75 1.75 0 0 0 16.25 5h-4.836a.25.25 0 0 1-.177-.073L9.823 3.513A1.75 1.75 0 0 0 8.586 3H3.75ZM10 8a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5A.75.75 0 0 1 10 8Z"
                    clipRule="evenodd"
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
          {pops?.map((pop) => (
            <div
              key={pop.id}
              className="p-4 bg-white rounded-lg shadow border border-gray-300"
            >
              <p>
                <span className="font-semibold">Identificador:</span>{" "}
                {pop.identifier}
                <hr />
                <span className="font-semibold">Ubicación:</span>{" "}
                {pop.ubication}
                <hr />
                <span className="font-semibold">Estado:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded text-white text-sm ${
                    pop.status === "created"
                      ? "bg-gray-500"
                      : pop.status === "open"
                      ? "bg-green-500"
                      : pop.status === "closed"
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  }`}
                >
                  {pop.status === "created"
                    ? "Creado"
                    : pop.status === "open"
                    ? "Abierto"
                    : pop.status === "closed"
                    ? "Cerrado"
                    : "Desconocido"}
                </span>
                <hr />
                <span className="font-semibold">Vendedor:</span> {pop.seller}
                <hr />
              </p>
              <div className="mt-2 flex justify-end space-x-2">
                <button
                  onClick={() => handleOpenClick(pop)}
                  className="ml-2 text-blue-600 hover:underline bg-red-400"
                  disabled={pop.status === "open" ? true : false}
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
                      d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleClosePop(pop)}
                  className="ml-2 text-blue-600 hover:underline bg-red-400"
                  disabled={pop.status === "closed" ? true : false}
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
                      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleEditClick(pop)}
                  className="ml-2 text-blue-600 hover:underline bg-red-400"
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
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(pop.id)}
                  className="ml-2 text-red-600 hover:underline bg-red-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
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
          title="Agregar Punto de Venta"
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        >
          <div className="max-w-md mx-auto text-primary-contrast">
            <div className="relative">
              <div>
                {!companyId && typeRequest === "add" && (
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
                      value={formData.company_id || ""}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      required
                    >
                      <option value="">Selecciona una empresa</option>
                      {/* Puedes reemplazar este array por tu lista real de empresas */}
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="mb-6">
                  <label
                    htmlFor="identifier"
                    className="mb-2 text-sm font-medium"
                  >
                    Nombre o Identificador
                  </label>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    value={formData.identifier}
                    onChange={handleChange}
                    required
                    className="block w-full rounded-md border py-1.5"
                    //disabled={typeRequest === "open" ? true : false}
                  />
                </div>
                <div className="mb-6">
                  <label
                    htmlFor="ubication"
                    className="block mb-2 text-sm font-medium"
                  >
                    Ubicación
                  </label>
                  <input
                    type="text"
                    id="ubication"
                    name="ubication"
                    value={formData.ubication}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    disabled={typeRequest === "open" ? true : false}
                  />
                </div>
                <div className="mb-6">
                  <label
                    htmlFor="status"
                    className="block mb-2 text-sm font-medium"
                  >
                    Estado del Punto de Venta
                  </label>
                  <input
                    type="text"
                    id="status"
                    name="status"
                    value={formData.status}
                    disabled
                    className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                </div>
                {typeRequest === "open" && (
                  <div className="mb-6">
                    <label
                      htmlFor="seller_id"
                      className="block mb-2 text-sm font-medium"
                    >
                      Nombre del Vendedor
                    </label>
                    <select
                      id="seller_id"
                      name="seller_id"
                      value={formData.seller_id}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      required
                    >
                      <option value="">Selecciona un Vendedor</option>
                      {sellerData.map((seller) => (
                        <option key={seller.id} value={seller.id}>
                          {seller.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  onClick={handleSavePop}
                  className="w-full p-2 bg-primary text-white rounded-lg"
                >
                  <span>Guardar</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default PopPage;
