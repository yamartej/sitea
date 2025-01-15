"use client"
import { useEffect, useState } from "react"; 
import { fetchCategoriesList, registerCategory, updateCategory, deleteCategory} from "@/app/api/admin/api";
import { getSession } from 'next-auth/react';
import { Category } from "@/types/type";
import { Spinner } from "react-bootstrap";
import Notification from "../Common/Notification/NotificationPage";

const CategoryPage = () =>{
    const [categories, setCategories] = useState<Category[]>([]);
    const [showRegister, setShowRegister] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const [showNotification, setShowNotification] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [typeMessage, setTypeMessage] = useState("error");
    const [typeRequest, setTypeRequest] = useState("create");
    const [formData, setFormData] = useState({
        id: "",
        name: "",
      });      
    
    useEffect(() => { 
        setShowSpinner(true);
        const fetchCategories  = async () => { 
            setShowSpinner(true);
            const session = await getSession(); 
            try {
                const data = await fetchCategoriesList(session?.user.token as string);
                setCategories(data); 
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
        fetchCategories (); 
    }, [showRegister]);
    
    const handleAddCategoryClick = () => {
        setShowRegister(true);
        setTypeRequest("create");
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
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            setShowSpinner(true);
            const session = await getSession();
            if(typeRequest === "create"){
                if(typeRequest === "create"){
                    const response = await registerCategory(
                        session?.user.token as any,
                        formData.name,
                    );
                    if (response){
                        setShowNotification(true);
                        setTypeMessage("success");
                        setErrorMessage("El registro fue agregado exitosamente"); 
                        setShowSpinner(false);
                        cleanInputs();
                    }
                }
            }
            else{
                const response = await updateCategory(
                    session?.user.token as any,
                    Number(formData.id),
                    formData.name,
                );
                if (response){
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
    }
    const handleEditClick = (category: Category) => {
        setFormData({
            name: category.name,
            id: category.id.toString(),
        });
        setShowRegister(true);
        setTypeRequest("update");
    };
    
    const handleDelete = async (id: number) => {
        const session = await getSession(); 
        const response = await deleteCategory(session?.user.token as string, id);
        if(response === 204){
            setCategories(categories.filter(category => category.id !== id));
            setShowNotification(true);
            setTypeMessage("success");
            setErrorMessage("El registro fue eliminado exitosamente"); 
            setShowSpinner(false);
        }
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
                    <h1 className="">Tabla Categorias</h1>
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
                            <th className="px-4 py-2 border border-gray-300">Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {categories?.map((category : Category) => (
                            <tr  key={category.id} className="bg-white hover:bg-gray-100 transition">
                                <td className="px-4 py-2 border border-gray-300">{category.name}</td>
                                <td className="px-4 py-2 border border-gray-300 text-center">
                                <button className="text-blue-600 hover:underline"
                                onClick={() => handleEditClick(category)}
                                >Editar</button>
                                <button
                                className="ml-2 text-red-600 hover:underline"
                                onClick={() => handleDelete(category.id)}
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
                    {categories?.map((category) => ( 
                        <div key={category.id} className="p-4 bg-white rounded-lg shadow border border-gray-300"> 
                            <p>
                                <span className="font-semibold">Nombre:</span> {category.name}</p> 
                            <div className="mt-2 flex justify-end space-x-2"> 
                                <button onClick={() => handleEditClick(category)} className="text-blue-600 hover:underline">Editar</button> 
                                <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:underline">Eliminar</button> 
                            </div> 
                        </div> ))}
                </div>
            )}            
            {showRegister && (
                <div id="register" className="">
                    <form onSubmit={handleSubmit}>
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
                        </div>
                        <button
                            type="submit"
                            className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white"
                        >
                            {buttonText}
                        </button>
                        
                    </form>
                    
                </div>
            )}
        </>
    )
    
}

export default CategoryPage;