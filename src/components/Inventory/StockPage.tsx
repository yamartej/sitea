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

    const [selectedStocks, setSelectedStocks] = useState<{ id: number; quantity: number }[]>([]);
    
    useEffect(() => { 
        setShowSpinner(true);
        const fetchInventories  = async () => { 
            setShowSpinner(true);
            const session = await getSession(); 
            try {
                const data = await fetchInventoriesList(session?.user.token as string);
                const dataProducts = await fetchProductsAvailable(session?.user.token as string);
                setProducts(
                    dataProducts.map((product: Product) => ({
                      ...product,
                      selectedQuantity: product.quantity, // Inicializar con la cantidad disponible
                    }))
                  );
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

    const columns: Column<Product>[] = React.useMemo(
        () => [
                        {
              id: "selection",
              Header: ({ getToggleAllRowsSelectedProps }) => (
                <input
                  type="checkbox"
                  checked={selectedStocks.length === products.length}
                  onChange={handleSelectAll}
                />
              ),
              Cell: ({ row }: { row: { original: Product } }) => (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedStocks.some((item) => item.id === row.original.id)}
                    onChange={() =>
                      handleSelectStocks(row.original.id, row.original.selectedQuantity || row.original.quantity)
                    }
                  />
                  
                </div>
              ),
            },
            {
                Header: "Producto",
                accessor: (row) => row.name,
                Cell: ({ cell }: { cell: { value: string } }) => (
                    <span>{cell.value}</span>
                ),
            },
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
            {
              Header: "Estatus",
              accessor: (row: Product) => row.inventory,
              Cell: ({ row }: { row: { original: Product } }) => (
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    row.original.inventory
                      ? "bg-green-100 text-green-800" // Verde si tiene datos en `inventory`
                      : "bg-red-100 text-red-800" // Rojo si `inventory` es null
                  }`}
                >
                  {row.original.inventory ? "Asignado" : "No asignado"}
                </span>
              ),
            },
            
        ],
        [selectedStocks, products]
    );

    const handleQuantityChange = (productId: number, value: string) => {
      const newQuantity = Math.min(Number(value), products.find((product) => product.id === productId)?.quantity || 0);
    
      // Actualizar la cantidad en el estado de productos
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === productId
            ? { ...product, selectedQuantity: newQuantity }
            : product
        )
      );
    
      // Actualizar la cantidad en el estado de productos seleccionados
      setSelectedStocks((prevSelected) =>
        prevSelected.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    };

        const handleSelectStocks = (id: number, quantity: number) => {
      setSelectedStocks((prevSelected) => {
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
      if (selectedStocks.length === products.length) {
        setSelectedStocks([]); // Deseleccionar todos
      } else {
        setSelectedStocks(
          products.map((product) => ({
            id: product.id,
            quantity: product.selectedQuantity || product.quantity,
          }))
        ); // Seleccionar todos con sus cantidades actuales
      }
    };

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
            data: products,
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
        if (selectedStocks && selectedStocks.length > 0) {
            const response = await registerInventory(
                session?.user.token as string,
                selectedStocks.map((item) => ({
                    id: item.id,
                    quantity: item.quantity,
                })),
                Number(formData.warehouseId)
            );
          if (response) {
            console.log("Registro exitoso:", response);
            setProducts((prevProducts) =>
              prevProducts.map((product) =>
                selectedStocks.some((item) => item.id === product.id)
                  ? { ...product, quantity: product.quantity - Number(formData.quantity) }
                  : product
              )
            );
            setShowNotification(true);
            setTypeMessage("success");
            setErrorMessage("El registro fue guardado exitosamente");
            setShowSpinner(false);
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

    const handleAddWarehouse = () => {
        setIsModalOpen(true);
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
                <div className="flex justify-between items-center mt-4 text-xs text-primary-contrast pb-5">
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
                    <table
                        {...getTableProps()}
                        className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                                        <thead className="text-xs text-gray-700 uppercase border-b border-t">
                              {headerGroups.map((headerGroup) => {
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
                                                        <tbody {...getTableBodyProps()}>
                              {page.map((row) => {
                                prepareRow(row);
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
                
        </>
    )
    
}

export default StockPage;