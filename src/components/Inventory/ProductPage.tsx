"use client"
import { useEffect, useState } from "react"; 
import { fetchProductsList, fetchCategoriesList, registerProduct, updateProduct, deleteProduct} from "@/app/api/admin/api";
import { fetchBatchesList } from "@/app/api/purchase/api";
import { getSession } from 'next-auth/react';
import { Batch, Category, Product } from "@/types/type";
import Spinner from "../Common/Spinner/SpinnerPage";
import Notification from "../Common/Notification/NotificationPage";
import Swal from "sweetalert2";
import { parseJSON } from "date-fns";


const ProductPage = () =>{
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
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
        price: "",
        category: "",
        quantity: "",
        batch: "",
      });    
    const [errors, setErrors] = useState<{
        priceMessage: string | null;
      }>({
        priceMessage: null,
      });
    const [batches, setBatches] = useState<Batch[]>([]);
    
    useEffect(() => { 
        setShowSpinner(true);
        const fetchProducts  = async () => { 
            setShowSpinner(true);
            const session = await getSession(); 
            try {
                const data = await fetchProductsList(session?.user.token as string);
                const dataCategories = await fetchCategoriesList(session?.user.token as string);
                const dataBatches = await fetchBatchesList(session?.user.token as string);

                setProducts(data); 
                setCategories(dataCategories); 
                setBatches(dataBatches);
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
        fetchProducts (); 
    }, []);
    
    const handleAddCategoryClick = () => {
        setShowRegister(true);
        setTypeRequest("create");
        cleanInputs();
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

        // Validación en tiempo real de las contraseñas
        if (name === "price") {
            const regex = /^[0-9]*\.?[0-9]*$/; 
            if (regex.test(value)) { 
                setFormData({ ...formData, [name]: value, });
                setBtnAction(false);
            }
            else{
                setErrorMessage("Validar Precio");
                setShowNotification(true);
                setBtnAction(true);
            }
        }
    };
    

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (errors.priceMessage) {
            setErrorMessage("Validar Precio");
            setShowNotification(true);
            return;
          } 
          else {
            setErrors({ ...errors, priceMessage: null });
          }
        try {
            setShowSpinner(true);
            const session = await getSession();
            if(typeRequest === "create"){
                if(typeRequest === "create"){
                    const response = await registerProduct(
                        session?.user.token as any,
                        formData.name,
                        formData.description,
                        Number(formData.price),
                        Number(formData.category),
                        Number(formData.quantity),
                        Number(formData.batch),
                    );
                    if (response){
                        // Buscar el nombre de la categoría correspondiente
                        setProducts([
                            ...products,
                            {
                                id: response.id,
                                name: formData.name,
                                description: formData.description,
                                price: Number(formData.price),
                                category_id: Number(formData.category),
                                quantity: Number(formData.quantity),
                                batch_id: Number(formData.batch),
                                category: categories.find((category) => category.id === Number(formData.category)) || { id: 0, name: "" },
                                batches: batches.find((batch) => batch.id === Number(formData.batch)) || { id: 0, name: "", description: "", quantity: 0, order_creation_date: "" },
                            },
                        ]);
                        setShowNotification(true);
                        setTypeMessage("success");
                        setErrorMessage("El registro fue agregado exitosamente"); 
                        setShowSpinner(false);
                        cleanInputs();
                    }
                }
            }
            else{
                const response = await updateProduct(
                    session?.user.token as any,
                    Number(formData.id),
                    formData.name,
                    formData.description,
                    Number(formData.price),
                    Number(formData.category),
                    Number(formData.quantity),
                    Number(formData.batch),
                );
                if (response){
                    setProducts(
                        products.map((product) => {
                            if (product.id === Number(formData.id)) {
                                return {
                                    ...product,
                                    name: formData.name,
                                    description: formData.description,
                                    price: Number(formData.price),
                                    category_id: Number(formData.category),
                                    quantity: Number(formData.quantity),
                                    batch_id: Number(formData.batch),
                                    category: categories.find((category) => category.id === Number(formData.category)) || { id: 0, name: "" },
                                    batches: batches.find((batch) => batch.id === Number(formData.batch)) || { id: 0, name: "", description: "", quantity: 0, order_creation_date: "" },
                                };
                            }
                            return product;
                        }
                    ));
                    
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
        }
        finally{
            if (showNotification) {
            const timer = setTimeout(() => {
                setShowNotification(false);
            }, 10000); // 10 segundos
            return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
            }
          }
      };
    const cleanInputs = () =>{
        formData.name = "";
        formData.description = "";
        formData.price = "";
        formData.quantity = "";
        formData.category="";
        formData.batch="";
    }
    
    const handleEditClick = (product: Product) => {
        setFormData({
            name: product.name,
            id: String(product.id),
            description: product.description,
            price: String(product.price),
            category: String(product.category_id),
            quantity: String(product.quantity || ""),
            batch: String(product.batch_id),
        });
        setShowRegister(true);
        setTypeRequest("update");
    };
    
    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: '¿Estás seguro de eliminar este producto?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar!'
        });
        if (result.isConfirmed) {
            const session = await getSession(); 
            const response = await deleteProduct(session?.user.token as string, id);
            if(response === 204){
                setProducts(products.filter(product => product.id !== id));
                setShowNotification(true);
                setTypeMessage("success");
                setErrorMessage("El registro fue eliminado exitosamente"); 
                setShowSpinner(false);
            }
            else{
                setShowNotification(true);
                setTypeMessage("error");
                setErrorMessage("Error eliminando el registro"); 
                setShowSpinner(false);
            }
        }
        
    };
    // Determinar el texto del botón basado en el estado 
    const buttonText = typeRequest === 'create' ? 'Guardar' : 'Actualizar';

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowNotification(false);
        }, 10000); // 10 segundos
    
        return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
    }, [showNotification]); // Dependencia para reiniciar el temporizador

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
                    <h1 className="">Gestión de Compras</h1>
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                        <button  id="add_user" type="button" onClick={handleAddCategoryClick} className="inline-flex items-center px-4 py-2 text-sm font-medium hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white">
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
                            <th className="px-4 py-2 border border-gray-300">Nombre</th>
                            <th className="px-4 py-2 border border-gray-300">Descripción</th>
                            <th className="px-4 py-2 border border-gray-300">Precio</th>
                            <th className="px-4 py-2 border border-gray-300">Categoría</th>
                            <th className="px-4 py-2 border border-gray-300">Cantidad</th>
                            <th className="px-4 py-2 border border-gray-300">Lote</th>
                            <th className="px-4 py-2 border border-gray-300">Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {products?.map((product : Product) => (
                            <tr  key={product.id} className="bg-white hover:bg-gray-100 transition">
                                <td className="px-4 py-2 border border-gray-300">{product.name}</td>
                                <td className="px-4 py-2 border border-gray-300">{product.description}</td>
                                <td className="px-4 py-2 border border-gray-300">{product.price}</td>
                                <td className="px-4 py-2 border border-gray-300">{product.category.name}</td>
                                <td className="px-4 py-2 border border-gray-300">
                                    {product.quantity ? product.quantity : 'Sin inventario'}
                                </td>
                                <td className="px-4 py-2 border border-gray-300">{product.batches.description}</td>
                                <td className="px-4 py-2 border border-gray-300 text-center">
                                <button className="text-blue-600 hover:underline"
                                onClick={() => handleEditClick(product)}
                                >Editar</button>
                                <button
                                className="ml-2 text-red-600 hover:underline"
                                onClick={() => handleDelete(product.id)}
                                >
                                    Eliminar
                                </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {!showRegister && (
                <div className="block md:hidden mt-2 space-y-4">
                    {products?.map((product) => ( 
                        <div key={product.id} className="p-4 bg-white rounded-lg shadow border border-gray-300"> 
                            <p>
                                <span className="font-semibold">Nombre:</span> {product.name}
                                <hr />
                                <span className="font-semibold">Descripción:</span> {product.description}
                                <hr />
                                <span className="font-semibold">Precio:</span> {product.price}
                                <hr />
                                <span className="font-semibold">Categoría:</span> {product.category.name}
                                <hr />
                                <span className="font-semibold">Inventario:</span> 
                                    {product.quantity ? product.quantity : 'Sin inventario'}
                            </p> 
                            
                            <div className="mt-2 flex justify-end space-x-2"> 
                                <button onClick={() => handleEditClick(product)} className="text-blue-600 hover:underline">Editar</button> 
                                <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:underline">Eliminar</button> 
                            </div> 
                        </div> ))}
                </div>
            )}            
            {showRegister && (
                <div id="register" className="">
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-6 mb-6 md:grid-cols-2">
                            <div>
                                <label htmlFor="company" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nombre de la Categoría</label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    required
                                    >
                                    <option value="">
                                        Selecciona una Categoría
                                    </option>
                                    {categories?.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="batch" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Lote</label>
                                <select
                                    id="batch"
                                    name="batch"
                                    value={formData.batch}
                                    onChange={handleInputChange}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    required
                                    >
                                    <option value="">
                                        Selecciona un Lote
                                    </option>
                                    {batches?.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid gap-6 mb-6 md:grid-cols-2">
                            <div>
                                <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nombre</label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="block w-full rounded-md border py-1.5 text-gray-900"
                                />
                            </div>
                            <div>
                                <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Descripción 
                                </label>
                                <input
                                    id="description"
                                    name="description"
                                    type="text"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="block w-full rounded-md border py-1.5 text-gray-900"
                                />
                            </div>
                            <div>
                                <label htmlFor="price" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Precio 
                                </label>
                                <input
                                    id="price"
                                    name="price"
                                    type="text"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                    className="block w-full rounded-md border py-1.5 text-gray-900"
                                />
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


export default ProductPage;