"use client"
import { useEffect, useState } from "react"; 
import { fetchWarehousesList, fetchInventoriesList, registerInventory, deleteInventory, updateInventory, fetchProductsAvailable} from "@/app/api/inventory/api";
import { getSession } from 'next-auth/react';
import { ErrorResponse, Inventory, Product, Warehouse } from "@/types/type";
import { Spinner } from "react-bootstrap";
import Notification from "../Common/Notification/NotificationPage";
import { format } from 'date-fns';

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
                inventory.product_id === parseInt(selectedProduct?.id) && 
                inventory.warehouse.id === parseInt(selectedWarehouse)
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
        const selectedProduct = products.find(product => product.id === parseInt(inventory.product_id));
        
        // Calcula el máximo permitido solo si el producto correspondiente existe
        const maxQuantity = selectedProduct ? inventory.quantity + selectedProduct.quantity : inventory.quantity;
        
        // Establece el estado disponible con el máximo permitido
        setAvailable(maxQuantity);
        setShowRegister(true);
        setFormData({
            id: inventory.id.toString(),
            productId: inventory.product_id.toString(),
            productName: inventory.product.product_name,
            quantity: inventory.quantity.toString(),
            warehouseId: inventory.warehouse.id.toString(),
        });
        setShowRegister(true);
        setTypeRequest("update");
    };
    
    const handleDelete = async (id: number) => {
        const session = await getSession(); 
        const response = await deleteInventory(session?.user.token as string, id);
        if(response === 204){
            setInventories(inventories.filter(inventory => inventory.id !== id));
            setShowNotification(true);
            setTypeMessage("success");
            setErrorMessage("El registro fue eliminado exitosamente"); 
            setShowSpinner(false);
        }
    };

    const updateProductQuantity = (productId, available) => {
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

    return(
        <>
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
        {(showRegister && (
        <div className="text-right">
            <button  id="add_user" type="button" onClick={handleBackClick} className="inline-flex px-4 py-2 text-sm font-medium hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                    <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 0 1-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 0 1 0 10.75H10.75a.75.75 0 0 1 0-1.5h2.875a3.875 3.875 0 0 0 0-7.75H3.622l4.146 3.957a.75.75 0 0 1-1.036 1.085l-5.5-5.25a.75.75 0 0 1 0-1.085l5.5-5.25a.75.75 0 0 1 1.06.025Z" clipRule="evenodd" />
                </svg>       
                 Regresar
            </button>
        </div>
        ))}
        {!showRegister && (
            <div>
                <div className="flex justify-between items-center">
                    <h1 className="">Tabla Inventario</h1>
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                        <button  id="add_user" type="button" onClick={handleAddRegisterClick} className="inline-flex items-center px-4 py-2 text-sm font-medium hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            )}
            {!showRegister && (
                <div className="overflow-x-auto hidden md:block">
                    <table className="min-w-full border-collapse border border-gray-300 text-left">
                        <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2 border border-gray-300">Almacen</th>
                            <th className="px-4 py-2 border border-gray-300">Producto</th>
                            <th className="px-4 py-2 border border-gray-300">Cantidad</th>
                            <th className="px-4 py-2 border border-gray-300">Fecha de Actualización</th>
                            <th className="px-4 py-2 border border-gray-300">Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {inventories.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center">Sin inventario agregados</td>
                            </tr>
                            ) : (
                                inventories.map((inventory) => (
                                <tr  key={inventory.id} className="bg-white hover:bg-gray-100 transition">
                                    <td className="px-4 py-2 border border-gray-300">{inventory.warehouse.name}</td>
                                    <td className="px-4 py-2 border border-gray-300">{inventory.product.name}</td>
                                    <td className="px-4 py-2 border border-gray-300">{inventory.quantity}</td>
                                    <td className="px-4 py-2 border border-gray-300"> {format(new Date(inventory.updated_at), 'dd/MM/yyyy HH:mm:ss')}</td>
                                    <td className="px-4 py-2 border border-gray-300 text-center">
                                        <button className="text-blue-600 hover:underline"
                                            onClick={() => handleEditClick(inventory)}
                                        >Editar</button>
                                        <button
                                            className="ml-2 text-red-600 hover:underline"
                                        onClick={() => handleDelete(inventory.id)}
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            )}
            
            {!showRegister && (
                <div className="block md:hidden mt-2 space-y-4">
                    {inventories?.map((inventory) => ( 
                        <div key={inventory.id} className="p-4 bg-white rounded-lg shadow border border-gray-300"> 
                            <p>
                                <span className="font-semibold">Almacen:</span> {inventory.warehouse.name}
                                <hr />
                                <span className="font-semibold">Producto:</span> {inventory.product.name}
                                <hr />
                                <span className="font-semibold">Cantidad:</span> {inventory.quantity}
                                <hr />
                                <span className="font-semibold">Actualización:</span> {format(new Date(inventory.updated_at), 'dd/MM/yyyy HH:mm:ss')}
                                <hr />
                            </p> 
                            
                            <div className="mt-2 flex justify-end space-x-2"> 
                                <button onClick={() => handleEditClick(inventory)} className="text-blue-600 hover:underline">Editar</button> 
                                <button onClick={() => handleDelete(inventory.id)} className="text-red-600 hover:underline">Eliminar</button> 
                            </div> 
                        </div> ))}
                </div>
            )}            
            {showRegister && (
                <div id="register" className="">
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-6 mb-6 md:grid-cols-2">
                            <div>
                                <label htmlFor="warehouseId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Almacen
                                </label>
                                <select
                                    id="warehouseId"
                                    name="warehouseId"
                                    value={formData.warehouseId}
                                    onChange={handleInputChange}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
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
                                <label htmlFor="productId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Producto</label>
                                <select
                                    id="productId"
                                    name="productId"
                                    value={formData.productId}
                                    onChange={handleInputChange}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    required
                                    disabled={!showRegister}
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
                                <label htmlFor="quantity" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Cantidad
                                </label>
                                <input
                                    id="quantity"
                                    name="quantity"
                                    type="text"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    required
                                    className="block w-full rounded-md border py-1.5 text-gray-900"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white"
                            disabled={!!btnAction}
                        >
                            {buttonText}
                        </button>
                        
                    </form>
                    
                </div>
            )}
        </>
    )
    
}

export default StockPage;