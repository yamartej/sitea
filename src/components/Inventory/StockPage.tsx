"use client"
import React, { useEffect, useState } from "react"; 
import { fetchWarehousesList, fetchInventoriesList, registerInventory, deleteInventory, updateInventory, fetchProductsAvailable} from "@/app/api/inventory/api";
import { getSession } from 'next-auth/react';
import { ErrorResponse, Inventory, Product, Warehouse } from "@/types/type";
import Notification from "../Common/Notification/NotificationPage";
import { format } from 'date-fns';
import Swal from "sweetalert2";
import { useTable, usePagination, Column, useSortBy } from 'react-table';
import InfoCardGrid from "../Common/Card/InfoCardGrid";
import Spinner from "../Common/Spinner/SpinnerPage";
import Modal from "../Common/Modal/ModalPage";

const StockPage = () => {
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [available, setAvailable] = useState(0);
    const [showRegister, setShowRegister] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const [btnAction, setBtnAction] = useState(false);
    const [showNotification, setShowNotification] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [typeMessage, setTypeMessage] = useState("error");
    const [typeRequest, setTypeRequest] = useState("create");
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [formData, setFormData] = useState<{
        id: number | string;
        productId: number | string;
        productName: string;
        quantity: number | string;
        warehouseId: number | string;
    }>({
        id: "",
        productId: "",
        productName: "",
        quantity: "",
        warehouseId: "",
    });
    
    useEffect(() => { 
        setShowSpinner(true);
        const fetchInventories  = async () => { 
            setShowSpinner(true);
            const session = await getSession(); 
            try {
                const data = await fetchInventoriesList(session?.user.token as string);
                const dataProducts = await fetchProductsAvailable(session?.user.token as string);
                const dataWarehouses = await fetchWarehousesList(session?.user.token as string);
                setInventories(data);
                setProducts(dataProducts.filter((product: Product) => product.quantity !== 0));
                setWarehouses(dataWarehouses);
              } catch (error) {
                console.error("Error fetching:", error);
                setErrorMessage("Error fetching");
                setShowNotification(true);
              }
              finally{
                setShowSpinner(false);
                if (showNotification) {
                const timer = setTimeout(() => {
                    setShowNotification(false);
                }, 10000); // 10 segundos
            
                return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
                }
              }
        }; 
        fetchInventories (); 
    }, [showRegister]);

    const columns: Column<Inventory>[] = React.useMemo(
        () => [
            {
                Header: "Almacen",
                accessor: "warehouse.name",
            },
            {
                Header: "Producto",
                accessor: "product.name",
            },
            {
                Header: "Cantidad",
                accessor: "quantity",
            },
            {
                Header: "Actualización",
                accessor: "updated_at",
                Cell: ({ value }) => format(new Date(value), 'dd/MM/yyyy HH:mm:ss'),
            },
            {
                Header: "Acciones",
                Cell: ({ row }) => (
                    <div className="flex justify-center space-x-2">
                        <button
                            className="text-primary"
                            onClick={() => handleEditClick(row.original)}

                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                                <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                            </svg>
                        </button>
                        <button
                            className="text-primary"
                            onClick={() => handleDelete(row.original.id)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4">
                                <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                ),
            },
        ],
        [inventories]
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
            data: inventories,
            initialState: { pageIndex: 0, pageSize: 10 }, // Mostrar 10 registros por página
        },
        useSortBy, // Agregar el plugin de ordenación
        usePagination // Agregar el plugin de paginación
    );
    
    useEffect(() => { 
        const timer = setTimeout(() => {
            setShowNotification(false);
        }, 10000); // 10 segundos
    
        return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
    }, [showNotification]);

    const handleAddRegisterClick = () => {
        setShowRegister(true);
        setTypeRequest("create");
        cleanInputs();
        setAvailable(0);
    };

    const handleBackClick = () => {
        setShowRegister(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { 
        const { name, value } = e.target; 
        setFormData({ 
            ...formData, 
            [name]: value 
        });
        if (name === 'productId'){
            const selectedProduct = products.find(product => product.id === parseInt(e.target.value));
            const selectedWarehouse = formData.warehouseId;
            const existingInventory = inventories.find(inventory => 
                inventory.product_id === Number(selectedProduct?.id) && 
                inventory.warehouse.id === Number(selectedWarehouse)
            );
            if (existingInventory) {
                setErrorMessage(`El producto ${existingInventory?.product.name} ya está incluido en el inventario del almacén ${existingInventory?.warehouse.name}`);
                setShowNotification(true);
                setTypeMessage("error");
                setBtnAction(true);
            } else {
                setAvailable(selectedProduct ? selectedProduct.quantity : 0);
                setBtnAction(false);
            }
        }

        if(name === 'quantity') {
            if(Number(value) > available){
                setTypeMessage("error");
                setBtnAction(true);
                setErrorMessage("Cantidad Ingresada es Mayor a la disponible");
                setShowNotification(true);
            }
            else{
                setBtnAction(false);
            }
        }
    };

    const handleError = (errors: ErrorResponse) => { 
        console.error("Error actualizando o guardando registro:", errors.message || errors);
        setShowNotification(true); 
        setTypeMessage("error"); 
        setErrorMessage(errors.status === 400 ? errors.response.data.message : "Error actualizando o guardando registro"); 
        setShowSpinner(false); 
    };
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            setShowSpinner(true);
            setIsModalOpen(false);
            const session = await getSession();
            let response;
            if (typeRequest === "create") {
                response = await registerInventory(
                    session?.user.token as string,
                    Number(formData.productId),
                    formData.quantity.toString(),
                    Number(formData.warehouseId),
                );
                if (response) {
                    setInventories([...inventories, response]);
                    setProducts((prevProducts) =>
                        prevProducts.map((product) =>
                            product.id === Number(formData.productId)
                                ? { ...product, quantity: product.quantity - Number(formData.quantity) }
                                : product
                        )
                    );
                    setAvailable(available - Number(formData.quantity));
                    
                    updateProductQuantity(response.product_id, response.quantity);
                    setShowNotification(true);
                    setTypeMessage("success");
                    setErrorMessage("El registro fue agregado exitosamente"); 
                    setShowSpinner(false);
                    cleanInputs();
                }
            } else {
                response = await updateInventory(
                    session?.user.token as string,
                    Number(formData.id),
                    Number(formData.productId),
                    formData.quantity.toString(),
                    Number(formData.warehouseId),
                );
                if (response) {
                    updateProductQuantity(response.product_id, response.quantity);
                    setShowNotification(true);
                    setTypeMessage("success");
                    setErrorMessage("El registro fue actualizado exitosamente"); 
                    setShowSpinner(false);
                    cleanInputs();
                }
            }
        } catch (error) {
            handleError(error as ErrorResponse);
        }
    };

    const cleanInputs = () =>{
        formData.quantity = "";
        formData.productId = "";
        formData.warehouseId = "";

    }
    const handleEditClick = (inventory: Inventory) => {
        // Encuentra el producto correspondiente
        const selectedProduct = products.find(product => product.id === Number(inventory.product_id));
        
        // Calcula el máximo permitido solo si el producto correspondiente existe
        const maxQuantity = selectedProduct ? inventory.quantity + selectedProduct.quantity : inventory.quantity;
        
        // Establece el estado disponible con el máximo permitido
        setAvailable(maxQuantity);
        setShowRegister(true);
        setFormData({
            id: inventory.id.toString(),
            productId: inventory.product_id.toString(),
            productName: inventory.product.name,
            quantity: inventory.quantity.toString(),
            warehouseId: inventory.warehouse.id.toString(),
        });
        setTypeRequest("update");
    };
    
    const handleDelete = async (id: number) => {
        Swal.fire({
                    title: '¿Estás seguro de que deseas eliminar este lote?',
                    text: "No podrás revertir esto.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Sí, eliminarlo!'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        setShowSpinner(true);
                        const session = await getSession(); 
                        const response = await deleteInventory(session?.user.token as string, id);
                        if(response === 204){
                            setInventories(inventories.filter(inventory => inventory.id !== id));
                            setShowNotification(true);
                            setTypeMessage("success");
                            setErrorMessage("El registro fue eliminado exitosamente"); 
                            setShowSpinner(false);
                        } else {
                            setShowNotification(true);
                            setErrorMessage('Error al eliminar el registro');
                            setTypeMessage('error');
                            setShowSpinner(false);
                        }
                    }
                })
        
        
    };

    const updateProductQuantity = (productId: number, available: number) => {
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            product.id === productId
              ? { ...product, quantity: product.quantity - available }
              : product
          )
        );
      };

      
    // Determinar el texto del botón basado en el estado 
    const buttonText = typeRequest === 'create' ? 'Guardar' : 'Actualizar';

    const cards = [
        { title: "Total Productos", value: products.length },
        { title: "Total Almacenes", value: warehouses.length },
        { title: "Total Registros", value: inventories.length },
        { title: "Total Cantidad", value: inventories.reduce((acc, inventory) => acc + inventory.quantity, 0) },
    ];

    const handleAddStock = () => {
        setIsModalOpen(true);
        //setShowRegister(true);
        setTypeRequest("create");
        cleanInputs();
        setAvailable(0);
    };


    return(
        <>
            <div>
                {showSpinner && (
                    <div className="spinner-container">
                        <Spinner/>  
                    </div>              
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <InfoCardGrid cards={cards}/>
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
                        <label htmlFor="pageSize" className="mr-2">Filas por página:</label>
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
                        <button id="add_user" type="button" onClick={() => {
                            handleAddStock();
                            }}  
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                                </svg>
                        </button>
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto hidden md:block">
                    <table
                        {...getTableProps()}
                        className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase border-b border-t">
                                {headerGroups.map((headerGroup) => {
                                    const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
                                    return (
                                        <tr key={key} {...restHeaderGroupProps}>
                                            {headerGroup.headers.map((column) => {
                                                const { key: columnKey, ...restColumnProps } = column.getHeaderProps(
                                                    column.getSortByToggleProps()
                                                    );
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
                                                                    : " ↓↑"
                                                                    }
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
                                        <tr {...row.getRowProps()} className="odd:bg-white bg-gray-100 hover:bg-gray-100 transition">
                                            {row.cells.map((cell) => (
                                                <td {...cell.getCellProps()} className="px-4 py-2">
                                                    {cell.render('Cell')}
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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                        <path fillRule="evenodd" d="M4.72 9.47a.75.75 0 0 0 0 1.06l4.25 4.25a.75.75 0 1 0 1.06-1.06L6.31 10l3.72-3.72a.75.75 0 1 0-1.06-1.06L4.72 9.47Zm9.25-4.25L9.72 9.47a.75.75 0 0 0 0 1.06l4.25 4.25a.75.75 0 1 0 1.06-1.06L11.31 10l3.72-3.72a.75.75 0 0 0-1.06-1.06Z" clipRule="evenodd" />
                    </svg>
                </button>

                <span className="mx-2">
                    Página{' '}
                    <strong>
                        {pageIndex + 1} de {pageOptions.length}
                    </strong>
                </span>

                <button
                    onClick={() => nextPage()}
                    disabled={!canNextPage}
                    className="px-4 py-2 bg-primary rounded disabled:opacity-50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                        <path fillRule="evenodd" d="M15.28 9.47a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L13.69 10 9.97 6.28a.75.75 0 0 1 1.06-1.06l4.25 4.25ZM6.03 5.22l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L8.69 10 4.97 6.28a.75.75 0 0 1 1.06-1.06Z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            
            <div className="block md:hidden mt-2 space-y-4">
                  {inventories?.map((inventory) => (
                    <div key={inventory.id} className="p-4 bg-white rounded-lg shadow border border-gray-300">
                      <p>
                        <span className="font-semibold">Almacen:</span> {inventory.warehouse?.name || "Sin información"}
                        <hr />
                        <span className="font-semibold">Producto:</span> {inventory.product?.name || "Sin información"}
                        <hr />
                        <span className="font-semibold">Cantidad:</span> {inventory.quantity || 0}
                        <hr />
                        <span className="font-semibold">Actualización:</span>{" "}
                        {inventory.updated_at
                          ? format(new Date(inventory.updated_at), "dd/MM/yyyy HH:mm:ss")
                          : "Sin información"}
                        <hr />
                      </p>
                
                      <div className="mt-2 flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditClick(inventory)}
                          className="text-blue-600 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(inventory.id)}
                          className="text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={typeRequest === "create" ? "Agregar Registro" : "Actualizar Registro"}
                    >
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-6 mb-6 md:grid-cols-2 text-primary-contrast">
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
                            <div>
                                <label htmlFor="productId" className="block mb-2 text-sm font-medium">Producto</label>
                                <select
                                    id="productId"
                                    name="productId"
                                    value={formData.productId}
                                    onChange={handleInputChange}
                                    className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    required
                                    >
                                    <option value="">
                                        Seleccione un producto
                                    </option>
                                    {products?.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} / Disponibilidad: {item.quantity} 
                                    </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="quantity" className="block mb-2 text-sm font-medium">
                                    Cantidad
                                </label>
                                <input
                                    id="quantity"
                                    name="quantity"
                                    type="text"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    required
                                    className="block w-full rounded-md border py-1.5"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full p-2 bg-primary text-white rounded-lg"
                            disabled={!!btnAction}
                        >
                            {buttonText}
                        </button>
                        
                    </form>
                </Modal>
                
        </>
    )
    
}

export default StockPage;