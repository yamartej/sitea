"use client";
import { Product, SaleReport } from "@/types/type";
import React, { use, useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import {
  fetchSaleslist,
  updateSaleDetails,
  removeSaleDetail,
} from "@/app/api/sale/api";
import { removeCreditNote } from "@/app/api/admin/api";
import Swal from "sweetalert2";
import {
  useTable,
  usePagination,
  Column,
  useSortBy,
  useExpanded,
} from "react-table";
import Modal from "../Common/Modal/ModalPage";
import { max } from "date-fns";
import Notification from "@/components/Common/Notification/NotificationPage";
import Spinner from "@/components/Common/Spinner/SpinnerPage";

const SalesReportPage = () => {
  const [sales, setSales] = useState<SaleReport[]>([]);
  const [salesAux, setSalesAux] = useState<SaleReport[]>([]);
  const [showSpinner, setShowSpinner] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [typeMessage, setTypeMessage] = useState("error");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRowId, setEditRowId] = useState<number | null>(null);
  const [totalProduct, setTotalProduct] = useState<number | null>(null);
  const [newTotalProduct, setNewTotalProduct] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    saleDetailId: "",
    name: "",
    customerId: "",
    saleId: "",
    productId: "",
    productName: "",
    quantity: "",
    maxQuantity: 0,
    saleTotal: 0,
    finalCost: 0,
    wholesaleFinalCost: 0,
  });
  const [ProductInfo, setProductInfo] = useState({
    final_cost: "",
    wholesale_final_cost: "",
    quantity: "",
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
      {
        Header: "Acciones",
        Cell: ({ row }) => (
          <button
            title="Eliminar Producto"
            onClick={() => {
              handleRemoveSale(row.original.id);
            }}
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

  useEffect(() => {
    const fetchSales = async () => {
      const session = await getSession();
      try {
        const data = await fetchSaleslist(session?.user?.token || "");
        setSales(data);
        setSalesAux(data);
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
    if (name === "quantity") {
      let total = 0;
      if (Number(value) >= 3) {
        total = Number(value) * formData.wholesaleFinalCost;
      } else {
        total = Number(value) * formData.finalCost;
      }
      setNewTotalProduct(total);
    }
  };

  const handleUpdateSale = async () => {
    setShowSpinner(true);
    const session = await getSession();
    try {
      const response = await updateSaleDetails(
        session?.user?.token || "",
        Number(formData.saleDetailId),
        Number(formData.saleId),
        Number(formData.quantity),
        Number(totalProduct),
        Number(newTotalProduct)
      );
      setShowSpinner(false);
      setErrorMessage("Venta actualizada correctamente");
      setTypeMessage("success");
      setShowNotification(true);
      // Actualizar la lista de ventas después de la actualización
      const updatedSales = sales.map((sale) => {
        if (sale.id === Number(formData.saleId)) {
          return {
            ...sale,
            total_amount:
              typeof newTotalProduct === "number"
                ? newTotalProduct
                : sale.total_amount, // Ensure number
            details: Array.isArray(sale.details)
              ? sale.details.map((detail) => {
                  if (detail.id === Number(formData.saleDetailId)) {
                    return {
                      ...detail,
                      quantity: Number(formData.quantity), // Actualiza la cantidad
                    };
                  }
                  return detail;
                })
              : [],
          };
        }
        return sale;
      });
      setSales(updatedSales as SaleReport[]);
    } catch (error) {
      console.error("Error al actualizar la venta:", error);
      setShowSpinner(false);
      setErrorMessage("Error al actualizar la venta");
      setTypeMessage("error");
      setShowNotification(true);
    } finally {
      setIsModalOpen(false);
      setEditRowId(null); // Resetea el ID de la fila editada
      setFormData({
        saleDetailId: "",
        name: "",
        customerId: "",
        saleId: "",
        productId: "",
        productName: "",
        quantity: "",
        maxQuantity: 0,
        saleTotal: 0,
        finalCost: 0,
        wholesaleFinalCost: 0,
      });
      setTotalProduct(null);
      setNewTotalProduct(null);
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(false);
    }, 10000); // 10 segundos
    return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
  }, [showNotification]); // Dependencia para reiniciar el temporizador

  const handleEditSalesDetails = (productInfo: Product) => {
    setIsModalOpen(true);
    let total = 0;
    //saber cuantos productos tenia para calcular y restar al monto total de la compra
    if (productInfo.quantity >= 3) {
      total =
        productInfo.quantity * Number(productInfo.product.wholesale_final_cost);
    } else {
      total = productInfo.quantity * Number(productInfo.product.final_cost);
    }
    setTotalProduct(total);
  };

  const handleRemoveSaleDetail = (productInfo: SaleReport) => {
    Swal.fire({
      title: "¿Estás seguro de que deseas eliminar esta venta?",
      text: "No podrás revertir esto.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#72cb10",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminarlo!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const session = await getSession();
        const response = await removeSaleDetail(
          session?.user.token as any,
          productInfo.id
        );
        if (response) {
          let totalToRemove = 0;
          if (productInfo.quantity >= 3) {
            totalToRemove =
              productInfo.quantity *
              Number(productInfo.product.wholesale_final_cost);
          } else {
            totalToRemove =
              productInfo.quantity * Number(productInfo.product.final_cost);
          }

          const updatedSales = sales.map((sale) => {
            if (sale.id === productInfo.sale_id) {
              return {
                ...sale,
                details: Array.isArray(sale.details)
                  ? sale.details.filter(
                      (detail) => detail.id !== productInfo.id
                    )
                  : [],
                total_amount: sale.total_amount - totalToRemove,
              };
            }
            return sale;
          });
          setSales(updatedSales as SaleReport[]);
          // Si no quedan detalles, eliminar la venta completa
          const filteredSales = updatedSales.filter(
            (sale) => sale.details?.length > 0
          );
          setSales(filteredSales as SaleReport[]);
          // Actualizar el estado de la notificación

          setShowSpinner(false);
          setShowNotification(true);
          setErrorMessage("Venta eliminada correctamente");
          setTypeMessage("success");
        } else {
          setShowNotification(true);
          setErrorMessage("Error al eliminar la venta");
          setTypeMessage("error");
        }
      }
    });
  };

  const handleRemoveSale = (saleId: number) => {
    Swal.fire({
      title: "¿Estás seguro de que deseas eliminar esta venta?",
      text: "No podrás revertir esto.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#72cb10",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminarlo!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const session = await getSession();
        try {
          const response = await removeCreditNote(
            session?.user.token as any,
            saleId
          );
          if (response) {
            setSales((prevSales) =>
              prevSales.filter((sale) => sale.id !== saleId)
            );
            setShowSpinner(false);
            setShowNotification(true);
            setErrorMessage("Venta eliminada correctamente");
            setTypeMessage("success");
          } else {
            setShowNotification(true);
            setErrorMessage("Error al eliminar la venta");
            setTypeMessage("error");
          }
        } catch (error) {
          console.error("Error al eliminar la venta:", error);
          setShowSpinner(false);
          setShowNotification(true);
          setErrorMessage("Error al eliminar la venta");
          setTypeMessage("error");
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
                sale.customer.name.toLowerCase().includes(searchTerm)
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
                                              handleEditSalesDetails(item);
                                              setFormData({
                                                saleDetailId:
                                                  item.id?.toString() || "",
                                                name:
                                                  row.original.customer?.name ||
                                                  "",
                                                customerId:
                                                  row.original.customer?.client_id?.toString() ||
                                                  "",
                                                saleId:
                                                  row.original.id?.toString() ||
                                                  "",
                                                productId:
                                                  item.product?.id?.toString() ||
                                                  "",
                                                productName:
                                                  item.product?.name || "",
                                                quantity:
                                                  item.quantity?.toString() ||
                                                  "",
                                                maxQuantity:
                                                  item.product.inventory
                                                    ?.quantity || 0,
                                                saleTotal:
                                                  row.original.total_amount,
                                                finalCost:
                                                  item.product.final_cost,
                                                wholesaleFinalCost:
                                                  item.product
                                                    .wholesale_final_cost,
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
                                            onClick={() => {
                                              handleRemoveSaleDetail(item);
                                            }}
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
                Producto
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
