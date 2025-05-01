"use client";
import React, { useEffect, useState } from "react";
import { Product } from "@/types/type"; // Asegúrate de que este archivo exista y exporte el tipo Product
import { getSession } from "next-auth/react";
import {
    fetchProductsAvailable,
    fetchInventoriesList,
    fetchWarehousesList,
    saveInventory,
} from "@/app/api/inventory/api";

import { useTable, useSortBy, usePagination, Column } from "react-table";
import Modal from "../Common/Modal/ModalPage";
import Spinner from "../Common/Spinner/SpinnerPage";
import Notification from "../Common/Notification/NotificationPage";

const Stock1Page = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [assignedProducts, setAssignedProducts] = useState<Product[]>([]);
    const [activeTab, setActiveTab] = useState<"unassigned" | "assigned">(
        "unassigned"
        );
    const [showSpinner, setShowSpinner] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showNotification, setShowNotification] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<{ id: number; quantity: number }[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [warehouses, setWarehouses] = useState<any[]>([]); // Cambia 'any' por el tipo adecuado
    const [formData, setFormData] = useState({
        warehouseId: "",
        warehouseName: "",
    });
    const [typeMessage, setTypeMessage] = useState("error");
    const [auxAsigned, setAuxAsigned] = useState<Product[]>([]);
    

        useEffect(() => {
      const fetchInventories = async () => {
        setShowSpinner(true);
        const session = await getSession();
        try {
          const dataProducts = await fetchProductsAvailable(
            session?.user.token as string
          );
          const dataInventories = await fetchInventoriesList(
            session?.user.token as string
          );
          const dataWarehouses = await fetchWarehousesList(
            session?.user.token as string
          );
    
          // Separar productos asignados y no asignados
          const unassigned = dataProducts.map((product: Product) => {
            const assignedQuantity = product.inventory?.quantity || 0;
            const remainingQuantity = product.quantity - assignedQuantity;
            return remainingQuantity > 0
              ? { ...product, quantity: remainingQuantity }
              : null; // Excluir productos sin cantidad pendiente
          }).filter((product: Product | null): product is Product => product !== null);
    
          const assigned = dataProducts.map((product: Product) => {
            const assignedQuantity = product.inventory?.quantity || 0;
            if (assignedQuantity > 0) {
              const warehouse = dataWarehouses.find(
                (w: { id: number; name: string }) => Number(w.id) === Number(product.inventory?.warehouse_id)
              );
              return {
                ...product,
                quantity: assignedQuantity,
                warehouseName: warehouse ? warehouse.name : "Sin asignar",
              };
            }
            return null; // Excluir productos sin cantidad asignada
          }).filter((product: Product | null): product is Product => product !== null);
    
          console.log("Productos sin asignar:", unassigned);
          console.log("Productos asignados:", assigned);
          console.log("Almacenes:", dataWarehouses);
    
          setWarehouses(dataWarehouses);
          setProducts(
            unassigned.map((product: Product) => ({
              ...product,
              selectedQuantity: product.quantity, // Inicializar con la cantidad disponible
            }))
          );
          setAssignedProducts(assigned);
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
      fetchInventories();
    }, []);
    
    const unassignedColumns: Column<Product>[] = React.useMemo(
        () => [
            {
                id: "selection",
                Header: ({ getToggleAllRowsSelectedProps }) => (
                    <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length}
                    onChange={handleSelectAll}
                    />
                    ),
                Cell: ({ row }: { row: { original: Product } }) => (
                    <div className="flex items-center space-x-2">
                        <input
                        type="checkbox"
                        checked={selectedProducts.some((item) => item.id === row.original.id)}
                        onChange={() =>
                            handleSelectProducts(row.original.id, row.original.selectedQuantity || row.original.quantity)
                            }
                        />
                    </div>
                ),
            },

            { Header: "Nombre", accessor: "name" as keyof Product },
            {
                Header: "Cantidad",
                accessor: "quantity",
                Cell: ({ row }: { row: { original: Product } }) => (
                    <input
                    type="number"
                    min="1"
                    max={row.original.quantity} // El valor máximo es la cantidad disponible
                    value={row.original.selectedQuantity || row.original.quantity} // Mostrar la cantidad seleccionada o la cantidad original
                    onChange={(e) => handleQuantityChange(row.original.id, e.target.value)} // Manejar el cambio
                    className="w-full border rounded p-1 text-center"
                    />
                ),
            },
        ],
        [ products, selectedProducts ] // Dependencias para memoizar las columnas
    );

        const assignedColumns: Column<Product>[] = React.useMemo(
      () => [
        { Header: "Nombre", accessor: "name" as keyof Product },
        { Header: "Cantidad", accessor: "quantity" as keyof Product },
        {
          Header: "Almacén",
          accessor: "warehouseName" as keyof Product, // Usar el campo preprocesado
          Cell: ({ row }: { row: { original: Product } }) => row.original.warehouseName || "Sin asignar",
        },
      ],
      []
    );
      

   
    const unassignedTableInstance = useTable(
      {
        columns: unassignedColumns,
        data: products, // Datos de productos sin asignar
        initialState: { pageIndex: 0, pageSize: 10 },
      },
      useSortBy,
      usePagination
    );
    
    const assignedTableInstance = useTable(
      {
        columns: assignedColumns,
        data: assignedProducts, // Datos de productos asignados
        initialState: { pageIndex: 0, pageSize: 10 },
      },
      useSortBy,
      usePagination
    );

    const {
      getTableProps: getUnassignedTableProps,
      getTableBodyProps: getUnassignedTableBodyProps,
      headerGroups: unassignedHeaderGroups,
      rows: unassignedRows,
      prepareRow: prepareUnassignedRow,
      page: unassignedPage,
      canPreviousPage: canUnassignedPreviousPage,
      canNextPage: canUnassignedNextPage,
      pageOptions: unassignedPageOptions,
      nextPage: unassignedNextPage,
      previousPage: unassignedPreviousPage,
      state: { pageIndex: unassignedPageIndex, pageSize: unassignedPageSize },
      setPageSize: setUnassignedPageSize,
    } = unassignedTableInstance;
    
    const {
      getTableProps: getAssignedTableProps,
      getTableBodyProps: getAssignedTableBodyProps,
      headerGroups: assignedHeaderGroups,
      rows: assignedRows,
      prepareRow: prepareAssignedRow,
      page: assignedPage,
      canPreviousPage: canAssignedPreviousPage,
      canNextPage: canAssignedNextPage,
      pageOptions: assignedPageOptions,
      nextPage: assignedNextPage,
      previousPage: assignedPreviousPage,
      state: { pageIndex: assignedPageIndex, pageSize: assignedPageSize },
      setPageSize: setAssignedPageSize,
    } = assignedTableInstance;

    const handlePageSizeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void = (e) => {
        setPageSize(Number(e.target.value));
    };
    const handleAddWarehouse = async () => {
        console.log("Asignar Almacen");
        setIsModalOpen(true);
    }

    const handleSelectProducts = (id: number, quantity: number) => {
      setSelectedProducts((prevSelected) => {
        const exists = prevSelected.find((item) => item.id === id);
        if (exists) {
          // Si ya está seleccionado, lo eliminamos
          return prevSelected.filter((item) => item.id !== id);
        } else {
          // Si no está seleccionado, lo agregamos con la cantidad actual
          return [...prevSelected, { id, quantity }];
        }
      });
    };

    const handleSelectAll = () => {
      if (selectedProducts.length === products.length) {
        setSelectedProducts([]); // Deseleccionar todos
      } else {
        setSelectedProducts(
          products.map((product) => ({
            id: product.id,
            quantity: product.selectedQuantity || product.quantity,
          }))
        ); // Seleccionar todos con sus cantidades actuales
      }
    };

    const handleQuantityChange = (id: number, value: string) => {
        const Newquantity = Math.min(Number(value), products.find((product) => product.id === id)?.quantity || 0);
        const quantity = Newquantity < 1 ? 1 : Newquantity; // Asegurarse de que la cantidad sea al menos 1
        setSelectedProducts((prevSelected) =>
            prevSelected.map((item) =>
                item.id === id ? { ...item, quantity } : item
            )
        );
        // Actualizar la cantidad seleccionada en el estado de productos

        setProducts((prevProducts) =>
            prevProducts.map((product) =>
                product.id === id ? { ...product, selectedQuantity: quantity } : product
            )
        );
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;

        const selectedWarehouse = warehouses.find(
            (w: { id: number; name: string }) => Number(w.id) === Number(e.target.value)
          );
        
          setFormData((prevData) => ({
            ...prevData,
            [name]: value,
            warehouseName: selectedWarehouse.name,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setShowSpinner(true);
        setIsModalOpen(false);
        const session = await getSession();
        try{

            //Validar si existe en el inventario un producto asignado en un almacen para actulizar el producto.
            const commonProducts  = selectedProducts.filter(sp =>
                assignedProducts.some(ap => ap.id === sp.id)
            );
            //Validar que productos no estan asignados para realizar un registro desde cero
            const differenceProducts = selectedProducts.filter(sp =>
                !assignedProducts.some(ap => ap.id === sp.id)
            );

            const response = await saveInventory(
                session?.user.token as string,
                formData.warehouseId,
                differenceProducts.map((product) => ({
                    id: product.id,
                    quantity: product.quantity,
                })),
                commonProducts.map((product) => ({
                    id: product.id,
                    quantity: product.quantity,
                }))
            );
            if (response) {
                console.log("Asignación exitosa:", response);
                // Actualizar las listas de productos
                setProducts((prevProducts) =>
                    prevProducts
                    .map((product) => {
                        const selectedProduct = selectedProducts.find((item) => item.id === product.id);
                        if (selectedProduct) {
                            const remainingQuantity = product.quantity - selectedProduct.quantity;
                            return remainingQuantity > 0
                                ? { ...product, quantity: remainingQuantity, selectedQuantity: remainingQuantity }
                                : undefined; // Cambiar null por undefined
                        }
                        return product;
                    })
                    .filter((product): product is Product => product !== undefined) // Filtrar valores undefined
                );
                
                //Agrega los nuevos productos a la tabla
                setAssignedProducts((prevAssigned) =>
                    prevAssigned.concat(
                        differenceProducts.map((product) => {
                            const originalProduct = products.find((p) => p.id === product.id);
                            return {
                                ...originalProduct,
                                warehouseId: Number(formData.warehouseId),
                                warehouseName: formData.warehouseName,
                                quantity: product.quantity,
                                } as Product;
                        })
                    )
                );

                //Actualiza el inventario existente
                setAssignedProducts(prevProducts =>
                    prevProducts.map(product => {
                      const commonProduct = commonProducts.find(p => p.id === product.id);
                      if (commonProduct) {
                        return {
                          ...product,
                          quantity: product.quantity + commonProduct.quantity
                        };
                      }
                      return product;
                    })
                  );

                // Limpiar selección y formulario
                setSelectedProducts([]);
                setFormData({ 
                    warehouseId: "",
                    warehouseName: ""  
                });

                // Mostrar notificación de éxito
                setTypeMessage("success");
                setErrorMessage("Asignación exitosa");
                setShowNotification(true);
                
                setTimeout(() => {
                    setShowNotification(false);
                }, 10000); // 10 segundos
            } 

        } catch (error) {
            console.error("Error:", error);
            setErrorMessage("Error al asignar el almacen");
            setShowNotification(true);
        } finally {
            setShowSpinner(false);
            const timer = setTimeout(() => {
                setShowNotification(false);
            }, 10000); // 10 segundos
            return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
        }

        
        
    };

    
    return (
        <div>
            <div>
                {showSpinner && (
                    <div className="spinner-container">
                        <Spinner/>  
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
                {/* Tabs */}
                <ul className="flex flex-wrap text-sm font-medium text-center text-gray-500 border-b border-gray-200">
                    <li className="mr-2">
                        <button
                        onClick={() => setActiveTab("unassigned")}
                        className={`inline-block p-4 rounded-t-lg ${
                            activeTab === "unassigned"
                            ? "text-blue-600 bg-gray-100"
                            : "hover:text-gray-600 hover:bg-gray-50"
                        }`}
                        >
                            Productos sin asignar
                        </button>
                    </li>
                    <li className="mr-2">
                        <button
                        onClick={() => setActiveTab("assigned")}
                        className={`inline-block p-4 rounded-t-lg ${
                            activeTab === "assigned"
                            ? "text-blue-600 bg-gray-100"
                            : "hover:text-gray-600 hover:bg-gray-50"
                        }`}
                        >
                        Productos asignados
                        </button>
                    </li>
                </ul>
                {/* Tab Content */}
                <div>
                    {activeTab === "unassigned" && (
                    <div>
                        <div>
                            <div className="flex justify-between items-center mt-4 text-xs text-primary-contrast pb-5">
                                <div className="">
                                    <label htmlFor="pageSize" className="mr-2">Filas por página:</label>
                                    <select
                                        id="pageSize"
                                        value={unassignedPageSize}
                                        onChange={(e) => setUnassignedPageSize(Number(e.target.value))}
                                        className="border rounded p-1"
                                    >
                                        {[5, 10, 20, 50].map((size) => (
                                            <option key={size} value={size}>
                                                {size}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="inline-flex rounded-md shadow-sm text-primary-contrast" role="group">
                                    <button type="button" onClick={() => {
                                        handleAddWarehouse();
                                        }}  className="px-3 py-2 text-xs font-medium text-center inline-flex items-center text-white bg-primary rounded">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                            <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm.75-10.25v2.5h2.5a.75.75 0 0 1 0 1.5h-2.5v2.5a.75.75 0 0 1-1.5 0v-2.5h-2.5a.75.75 0 0 1 0-1.5h2.5v-2.5a.75.75 0 0 1 1.5 0Z" clipRule="evenodd" />
                                        </svg>
                                        Asignar Almacen
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto hidden md:block">
                            <table {...getUnassignedTableProps()} className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase border-b border-t">
                                    {unassignedHeaderGroups.map((headerGroup) => {
                                        const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps(); // Extraer `key`
                                        return (
                                            <tr key={key} {...restHeaderGroupProps}>
                                                {headerGroup.headers.map((column) => {
                                                    const { key: columnKey, ...restColumnProps } = column.getHeaderProps(column.getSortByToggleProps()); // Extraer `key`
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
                                <tbody {...getUnassignedTableBodyProps()}>
                                    {unassignedPage.map((row) => {
                                        prepareUnassignedRow(row);
                                        const { key, ...restRowProps } = row.getRowProps(); // Extraer `key`
                                        return (
                                            <tr key={key} {...restRowProps} className="odd:bg-white bg-gray-100 hover:bg-gray-100 transition">
                                                {row.cells.map((cell) => {
                                                    const { key: cellKey, ...restCellProps } = cell.getCellProps(); // Extraer `key`
                                                    return (
                                                        <td key={cellKey} {...restCellProps} className="px-4 py-2">
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
                        {/* Paginación */}
                        <div className="text-right mt-4 text-xs text-gray-700 dark:text-gray-400 border-t border-gray-200 pt-2">
                            <button
                                onClick={() => unassignedPreviousPage()}
                                disabled={!canUnassignedPreviousPage}
                                className="px-4 py-2 bg-primary rounded disabled:opacity-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                    <path fillRule="evenodd" d="M4.72 9.47a.75.75 0 0 0 0 1.06l4.25 4.25a.75.75 0 1 0 1.06-1.06L6.31 10l3.72-3.72a.75.75 0 1 0-1.06-1.06L4.72 9.47Zm9.25-4.25L9.72 9.47a.75.75 0 0 0 0 1.06l4.25 4.25a.75.75 0 1 0 1.06-1.06L11.31 10l3.72-3.72a.75.75 0 0 0-1.06-1.06Z" clipRule="evenodd" />
                                </svg>
                            </button>

                            <span className="mx-2">
                                Página{' '}
                                <strong>
                                    {unassignedPageIndex + 1} de {unassignedPageOptions.length}
                                </strong>
                            </span>

                            <button
                                onClick={() => unassignedNextPage()}
                                disabled={!canUnassignedNextPage}
                                className="px-4 py-2 bg-primary rounded disabled:opacity-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                    <path fillRule="evenodd" d="M15.28 9.47a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L13.69 10 9.97 6.28a.75.75 0 0 1 1.06-1.06l4.25 4.25ZM6.03 5.22l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L8.69 10 4.97 6.28a.75.75 0 0 1 1.06-1.06Z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    )}
                    {/* Productos Asignados */}
                    {activeTab === "assigned" && (
                        <div>
                            <table {...getAssignedTableProps()} className="w-full text-sm text-left text-gray-500">
                                <thead>
                                    {assignedHeaderGroups.map((headerGroup) => (
                                    <tr {...headerGroup.getHeaderGroupProps()}>
                                        {headerGroup.headers.map((column) => (
                                        <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                                            {column.render("Header")}
                                        </th>
                                        ))}
                                    </tr>
                                    ))}
                                </thead>
                                <tbody {...getAssignedTableBodyProps()}>
                                    {assignedPage.map((row) => {
                                    prepareAssignedRow(row);
                                    return (
                                        <tr {...row.getRowProps()}>
                                        {row.cells.map((cell) => (
                                            <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                                        ))}
                                        </tr>
                                    );
                                    })}
                                </tbody>
                            </table>

                            {/* Paginación */}
                            <div className="flex justify-between items-center mt-4">
                                <button
                                    onClick={() => assignedPreviousPage()}
                                    disabled={!canAssignedPreviousPage}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                                >
                                    Anterior
                                </button>
                                <span>
                                    Página{" "}
                                    <strong>
                                    {assignedPageIndex + 1} de {assignedPageOptions.length}
                                    </strong>
                                </span>
                                <button
                                    onClick={() => assignedNextPage()}
                                    disabled={!canAssignedNextPage}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                                >
                                    Siguiente
                                </button>
                                <select
                                    value={assignedPageSize}
                                    onChange={(e) => setAssignedPageSize(Number(e.target.value))}
                                    className="border rounded p-1"
                                >
                                    {[5, 10, 20, 50].map((size) => (
                                    <option key={size} value={size}>
                                        Mostrar {size}
                                    </option>
                                    ))}
                                </select>
                            </div>
                            
                        </div>
                    )}
                </div>
            </div>
            {/* Modal para agregar Almacen */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Agregar Almacen"
                >
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 mb-6 md:grid-cols-1 text-primary-contrast">
                        <div>
                            <label htmlFor="warehouseId" className="block mb-2 text-sm font-medium">
                                Almacen
                            </label>
                            <select
                                id="warehouseId"
                                name="warehouseId"
                                value={formData.warehouseId}
                                onChange={handleInputChange}
                                className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                required
                            >
                                <option value="">
                                    Seleccione un Almacen
                                </option>
                                {warehouses?.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button
                    type="submit"
                    className="w-full p-2 bg-primary text-white rounded-lg"
                    >
                        Guardar
                    </button>
                </form>
            </Modal>
        </div>
        
    );
};

export default Stock1Page;

function setPageSize(arg0: number) {
    throw new Error("Function not implemented.");
}
