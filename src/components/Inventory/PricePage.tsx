"use client";
import React, { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { Batch, Product, Company } from "@/types/type";
import Notification from "../Common/Notification/NotificationPage";
import Spinner from "../Common/Spinner/SpinnerPage";
import { useTable, usePagination, Column, useSortBy } from "react-table";
import {
  fetchProductsAvailable,
  updateFinalCost,
} from "@/app/api/inventory/api";
import Modal from "../Common/Modal/ModalPage";
import { fetchCompaniesList } from "@/app/api/admin/api";
import { fetchBatchesList } from "@/app/api/purchase/api";

const PricePage = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsAux, setProductsAux] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [typeMessage, setTypeMessage] = useState("error");
  const [editRowId, setEditRowId] = useState<number | null>(null);
  const [editedCost, setEditedCost] = useState<string>("");
  const [whosaleEditedCost, setWhosaleEditedCost] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadPrices = async () => {
      setShowSpinner(true);
      try {
        const session = await getSession();
        const token = session?.user.token;
        const ownCompanyId = session?.user.company_id || null;
        setCompanyId(ownCompanyId);

        if (!token) {
          throw new Error("Sesión no disponible");
        }

        if (ownCompanyId) {
          const [companyBatches, companyProducts] = await Promise.all([
            fetchBatchesList(token, ownCompanyId),
            fetchProductsAvailable(token, ownCompanyId),
          ]);
          setBatches(companyBatches as Batch[]);
          setProductsAux(companyProducts as Product[]);
          setProducts([]);
        } else {
          const companyData = await fetchCompaniesList(token);
          setCompanies(companyData);
          setBatches([]);
          setProductsAux([]);
          setProducts([]);
        }
      } catch (error) {
        console.error("Error al cargar precios:", error);
        setTypeMessage("error");
        setErrorMessage("No se pudieron cargar los lotes y sus productos");
        setShowNotification(true);
      } finally {
        setShowSpinner(false);
      }
    };
    loadPrices();
  }, []);

  const activeCompanyId = companyId || selectedCompanyId || null;

  const isWritableCompanyRecord = (
    recordCompanyId: string | number | null | undefined
  ) =>
    Boolean(activeCompanyId) &&
    String(recordCompanyId) === String(activeCompanyId);

  const handleCompanyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCompanyId = e.target.value;
    setSelectedCompanyId(nextCompanyId);
    setSelectedBatchId(null);
    setSearchTerm("");
    setIsModalOpen(false);
    setProducts([]);

    if (!nextCompanyId) {
      setProductsAux([]);
      setBatches([]);
      return;
    }

    try {
      setShowSpinner(true);
      const session = await getSession();
      const token = session?.user.token;
      if (!token) {
        throw new Error("Sesión no disponible");
      }

      const [companyBatches, companyProducts] = await Promise.all([
        fetchBatchesList(token, nextCompanyId),
        fetchProductsAvailable(token, nextCompanyId),
      ]);
      setBatches(companyBatches as Batch[]);
      setProductsAux(companyProducts as Product[]);
    } catch (error) {
      console.error("Error cargando precios de la empresa:", error);
      setBatches([]);
      setProductsAux([]);
      setErrorMessage("Error cargando lotes y productos de la empresa");
      setTypeMessage("error");
      setShowNotification(true);
    } finally {
      setShowSpinner(false);
    }
  };

  const selectedBatch = batches.find((batch) => batch.id === selectedBatchId);
  const selectedCosts = selectedBatch?.costs ?? [];
  const totalAdditionalCosts = selectedCosts.reduce(
    (sum, cost) => sum + Number(cost.amount || 0),
    0
  );

  const filterByBatchAndSearch = (batchId: number | null, term: string) =>
    batchId === null
      ? []
      : productsAux.filter(
          (product) =>
            product.batches?.id === batchId &&
            product.name.toLowerCase().includes(term.toLowerCase())
        );

  const handleBatchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const batchId = event.target.value ? Number(event.target.value) : null;
    setSelectedBatchId(batchId);
    setSearchTerm("");
    setProducts(filterByBatchAndSearch(batchId, ""));
  };

  const columns = React.useMemo<Column<Product>[]>(    () => [
      {
        Header: "Nombre",
        accessor: "name",
      },
      {
        Header: "Precio Compra",
        accessor: "price",
      },
      {
        Header: "Compra + costos adicionales",
        accessor: "price_shipping",
      },
      {
        Header: "Referencia (margen 35%)",
        Cell: ({ row }: { row: { original: Product } }) => {
          return (
            <div>{(Number(row.original.price_shipping) / 0.65).toFixed(2)}</div>
          );
        },
      },
      {
        Header: "Precio Mayor",
        accessor: "wholesale_final_cost",
        Cell: ({ row }: { row: { original: Product } }) => {
          return (
            <div>{Number(row.original.wholesale_final_cost).toFixed(2)}</div>
          );
        },
      },

      {
        Header: "Precio Detal",
        accessor: "final_cost",
        Cell: ({ row }: { row: { original: Product } }) => {
          return <div>{Number(row.original.final_cost).toFixed(2)}</div>;
        },
      },
      {
        Header: "Acciones",
        Cell: ({ row }: { row: { original: Product } }) => {
          const { id, final_cost, wholesale_final_cost } = row.original;
          const isWritableProduct =
            row.original.batches?.status === "received" &&
            isWritableCompanyRecord(row.original.batches?.company_id);

          const handleClick = () =>
            handleEditClick(
              id,
              Number(final_cost),
              Number(wholesale_final_cost)
            );

          return (
            <div className="flex space-x-2 justify-center">
              <button
                className="text-edit disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={handleClick}
                disabled={!isWritableProduct}
                title={
                  isWritableProduct
                    ? "Editar precio"
                    : row.original.batches?.status !== "received"
                      ? "Recibe el lote antes de configurar precios de venta"
                      : "Registro legacy de solo lectura"
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                  <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                </svg>
              </button>
            </div>
          );
        },
      },
    ],
    [products, editRowId, editedCost, whosaleEditedCost, activeCompanyId]
  );

  // 1. Obtén gotoPage del hook useTable:
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
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
      data: products,
      manualSortBy: true,
      disableMultiSort: true,
      pageCount: -1,
      manualPagination: false,
      autoResetPage: false,
    },
    useSortBy,
    usePagination
  );

  // 2. Antes de guardar, guarda el pageIndex actual:
  const handleSaveFinalCost = async (productId: number) => {
    const currentPage = pageIndex; // <-- guarda el índice de página actual
    try {
      setShowSpinner(true);
      const session = await getSession();
      if (!activeCompanyId) {
        setErrorMessage("Selecciona una empresa antes de actualizar");
        setShowNotification(true);
        setTypeMessage("error");
        setShowSpinner(false);
        return;
      }
      const response = await updateFinalCost(
        session?.user.token as any,
        Number(editRowId),
        Number(editedCost),
        Number(whosaleEditedCost),
      activeCompanyId
      );
      if (response) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  final_cost: parseFloat(editedCost),
                  wholesale_final_cost: parseFloat(whosaleEditedCost),
                }
              : p
          )
        );
        setProductsAux((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  final_cost: parseFloat(editedCost),
                  wholesale_final_cost: parseFloat(whosaleEditedCost),
                }
              : p
          )
        );
        setEditedCost("");
        setWhosaleEditedCost("");
        setShowNotification(true);
        setTypeMessage("success");
        setErrorMessage("Costo final actualizado");
        setShowSpinner(false);

        // 3. Vuelve a la página donde estabas
        gotoPage(currentPage);
      }
    } catch (errors) {
      console.error("Error updating:", errors);
      setErrorMessage("Error updating");
      setShowNotification(true);
      setTypeMessage("error");
      setShowSpinner(false);
    } finally {
      setShowSpinner(false);
      setEditedCost("");
      setWhosaleEditedCost("");
      setIsModalOpen(false);
      setShowSpinner(false);
    }
  };

  const handleEditClick = (
    id: number,
    retail: number | null,
    whosale: number | null
  ) => {
    setEditRowId(id);
    setEditedCost(retail?.toString() || "");
    setWhosaleEditedCost(whosale?.toString() || "");
    setIsModalOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(false);
    }, 10000); // 10 segundos

    return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
  }, [showNotification]); // Dependencia para reiniciar el temporizador

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

      {!companyId && (
        <div className="mt-4 text-primary-contrast">
          <label
            htmlFor="price_company_id"
            className="block mb-2 text-sm font-medium"
          >
            Empresa
          </label>
          <select
            id="price_company_id"
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
          <div className="flex justify-between items-center mt-4 text-xs text-primary-contrast">
            <div>
              <select
                id="batch"
                name="batch"
                value={selectedBatchId ?? ""}
                onChange={handleBatchChange}
                className="border rounded p-1"
                required
                disabled={!activeCompanyId}
              >
                <option value="">Selecciona un Lote</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name} ({batch.status === "received" ? "Recibido" : batch.status === "created" ? "Creado" : batch.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      {selectedBatch && (
        <section className="mt-4 rounded border p-4 text-sm text-primary-contrast">
          <p className="font-semibold">
            Lote: {selectedBatch.name} — {selectedBatch.status === "received" ? "Recibido" : "Creado"}
          </p>
          {selectedBatch.status !== "received" && (
            <p className="mt-2">
              Puedes consultar productos y costos. Para configurar precios de venta,
              primero cambia el lote a Recibido en Compras → Lotes.
            </p>
          )}
          <div className="mt-3">
            <p className="font-semibold">Costos adicionales del lote</p>
            {selectedCosts.length > 0 ? (
              <ul className="mt-2 list-disc pl-5">
                {selectedCosts.map((cost) => (
                  <li key={cost.id}>
                    {cost.description || "Costo adicional"}: {Number(cost.amount).toFixed(2)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1">
                No hay costos adicionales registrados para este lote.
              </p>
            )}
            <p className="mt-2 font-semibold">
              Total de costos adicionales: {totalAdditionalCosts.toFixed(2)}
            </p>
            <p className="mt-1">
              Registra envío, comisiones u otros gastos en Compras → Costos.
              Se distribuyen entre las unidades del lote y se reflejan en
              la columna Compra + costos adicionales.
            </p>
          </div>
        </section>
      )}
      {activeCompanyId && batches.length === 0 && !showSpinner && (
        <p className="mt-3 text-sm text-primary-contrast">
          No hay lotes registrados para la empresa seleccionada.
        </p>
      )}
      {selectedBatch && products.length === 0 && !showSpinner && (
        <p className="mt-3 text-sm text-primary-contrast">
          No hay productos que coincidan con el lote y la búsqueda.
        </p>
      )}
      <div>
        <div className="mt-4">
          <input
            type="text"
            placeholder="Buscar por Nombre del Producto"
            className="border rounded p-2 w-full"
            value={searchTerm}
            disabled={selectedBatchId === null}
            onChange={(e) => {
              const term = e.target.value;
              setSearchTerm(term);
              setProducts(filterByBatchAndSearch(selectedBatchId, term));
              gotoPage(0);
            }}
          />
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
                  className={`transition ${
                    row.original.id === editRowId
                      ? "bg-yellow-300 border-l-4 border-yellow-500" // Fila resaltada
                      : "odd:bg-white bg-gray-100 hover:bg-gray-100"
                  }`}
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
        title="Configurar precios de venta"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveFinalCost(editRowId as number);
          }}
        >
          <div className="grid gap-6 mb-6 md:grid-cols-2 text-primary-contrast">
            <div>
              <label
                htmlFor="wholesale"
                className="block mb-2 text-sm font-medium"
              >
                Precio al Mayor
              </label>
              <input
                id="wholesale"
                name="wholesale"
                value={whosaleEditedCost}
                onChange={(e) => setWhosaleEditedCost(e.target.value)}
                type="number"
                min="0.01"
                step="0.01"
                required
                className="block w-full rounded-md border py-1.5"
              />
            </div>

            <div>
              <label
                htmlFor="retail"
                className="block mb-2 text-sm font-medium"
              >
                Precio al Detal
              </label>
              <input
                id="retail"
                name="retail"
                value={editedCost}
                onChange={(e) => setEditedCost(e.target.value)}
                type="number"
                min="0.01"
                step="0.01"
                required
                className="block w-full rounded-md border py-1.5"
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

export default PricePage;
