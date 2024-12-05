"use client"
import { useEffect, useState } from "react"; 
import { fetchUsersList, fetchRoleList, registerUser, deleteUser, updateUser, fetchCompaniesList} from "@/app/api/admin/api";
import { validateEmail } from "@/app/api/auth/[...nextauth]/api";
import { getSession } from 'next-auth/react';
import { Role, User, Company } from "@/types/type";
import { Spinner } from "react-bootstrap";
import Notification from "../Common/Notification/NotificationPage";

const Userpage = () =>{ 
    const [users, setUsers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [showSpinner, setShowSpinner] = useState(false);
    const [showNotification, setShowNotification] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [typeMessage, setTypeMessage] = useState("error");
    const [showUserRegister, setShowUserRegister] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [typeRequest, setTypeRequest] = useState("create");
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        email: "",
        password: "123456789",
        passwordConfirmation: "123456789",
        company: "",
        rol: "",
        companyName: "",
      });      
    
    useEffect(() => { 
        setShowSpinner(true);
        const fetchUsers  = async () => { 
            setShowSpinner(true);
            const session = await getSession(); 
            try {
                const data = await fetchUsersList(session?.user.token as string);
                const roles = await fetchRoleList(session?.user.token as string);
                const companies = await fetchCompaniesList(session?.user.token as string);
                setRoles(roles);
                setUsers(data); 
                setCompanies(companies); 
                filterUsers(data, session?.user);
              } catch (error) {
                console.error("Error fetching users:", error);
                setErrorMessage("Error fetching users");
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
        fetchUsers (); 
    }, [showUserRegister]);
    
    const filterUsers = (users: User[], user: any) => {
        if (user.roles.some((role: any) => role.name === "Soporte Técnico")) {
            setFilteredUsers(users);
        } else if (user.roles.some((role: any) => role.name === "Administrador")) {
            setFilteredUsers(users.filter(u => u.company_id === user.company_id));
        }
    };

    const handleAddUserClick = () => {
        setShowUserRegister(true);
        setTypeRequest("create");
    };

    const handleBackClick = () => {
        setShowUserRegister(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { 
        const { name, value } = e.target; 
        setFormData({ 
            ...formData, 
            [name]: value 
        });
    };

    const handleCompanyBlur = () => {
        if (formData.company && !companies.some(company => company.name === formData.company)) {
            companies.push({ id: companies.length + 1, name: formData.company });
        }
    };
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            setShowSpinner(true);
            const session = await getSession();
            if(typeRequest === "create"){
                const emailExists = await validateEmail(formData.email);
                if (emailExists) {
                    setShowNotification(true);
                    setErrorMessage("Correo Existe");
                    setShowSpinner(false);
                }
                else{
                    if(typeRequest === "create"){
                        const response = await registerUser(
                            session?.user.token as any,
                            formData.name,
                            formData.email,
                            formData.company,
                            formData.rol,
                            formData.companyName,
                            formData.password,
                        );
                        if (response){
                            setShowNotification(true);
                            setTypeMessage("success");
                            setErrorMessage("El usuario fue agregado exitosamente"); 
                            setShowSpinner(false);
                            cleanInputs();
                        }
                    }
                    
                }
            }
            else{
                const response = await updateUser(
                    session?.user.token as any,
                    Number(formData.id),
                    formData.name,
                    formData.email,
                    formData.company,
                    formData.rol,
                    formData.companyName,
                );
                if (response){
                    setShowNotification(true);
                    setTypeMessage("success");
                    setErrorMessage("El usuario fue agregado exitosamente"); 
                    setShowSpinner(false);
                    cleanInputs();
                }
            }
        } catch (errors) {
            console.error("Error guardando usuario:", errors);
            setShowNotification(true);
            setTypeMessage("error");
            setErrorMessage("Error guardando usuario"); 
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
        formData.company="";
        formData.name = "";
        formData.email = "";
        formData.rol = "";
        formData.companyName = "";
    }
    const handleEditClick = (user: User) => {
        setFormData({
            name: user.name,
            email: user.email,
            companyName: user.company_id,
            rol: user.roles.length > 0 ? user.roles[0].id : '',
            id: user.id,
        });
        setShowUserRegister(true);
        setTypeRequest("update");
    };

    const handleDelete = async (userId: number) => {
        const session = await getSession(); 
        const response = await deleteUser(session?.user.token as string, userId);
        if(response === 204){
            // Actualizar el estado local para reflejar la eliminación
            setFilteredUsers(filteredUsers.filter(user => user.id !== userId));
            setShowNotification(true);
            setTypeMessage("success");
            setErrorMessage("El usuario fue eliminado exitosamente"); 
            setShowSpinner(false);
        }
    };
    // Determinar el texto del botón basado en el estado 
    const buttonText = typeRequest === 'create' ? 'Crear Usuario' : 'Actualizar Usuario';

    

     return (
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
        {(showUserRegister && (
        <div className="text-right">
            <button  id="add_user" type="button" onClick={handleBackClick} className="inline-flex px-4 py-2 text-sm font-medium hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                    <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 0 1-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 0 1 0 10.75H10.75a.75.75 0 0 1 0-1.5h2.875a3.875 3.875 0 0 0 0-7.75H3.622l4.146 3.957a.75.75 0 0 1-1.036 1.085l-5.5-5.25a.75.75 0 0 1 0-1.085l5.5-5.25a.75.75 0 0 1 1.06.025Z" clipRule="evenodd" />
                </svg>       
                 Regresar
            </button>
        </div>
        ))}
        {!showUserRegister && (
            <div>
                <div className="flex justify-between items-center">
                    <h1 className="">Tabla Usuarios</h1>
                    <div className="inline-flex rounded-md shadow-sm" role="group">
                        <button  id="add_user" type="button" onClick={handleAddUserClick} className="inline-flex items-center px-4 py-2 text-sm font-medium hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:focus:ring-blue-500 dark:focus:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            )}
            {!showUserRegister && (
                <div className="overflow-x-auto hidden md:block">
                    <table className="min-w-full border-collapse border border-gray-300 text-left">
                        <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2 border border-gray-300">Nombre</th>
                            <th className="px-4 py-2 border border-gray-300">Email</th>
                            <th className="px-4 py-2 border border-gray-300">Roles</th>
                            <th className="px-4 py-2 border border-gray-300">Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredUsers?.map((user : User) => (
                            <tr  key={user.id} className="bg-white hover:bg-gray-100 transition">
                                <td className="px-4 py-2 border border-gray-300">{user.name}</td>
                                <td className="px-4 py-2 border border-gray-300">{user.email}</td>
                                <td className="px-4 py-2 border border-gray-300">
                                    <ul className="list-disc pl-5">
                                        {user.roles.map((role) => (
                                        <li key={role.id}>{role.name}</li>
                                        ))}
                                    </ul>
                                </td>
                                <td className="px-4 py-2 border border-gray-300 text-center">
                                <button className="text-blue-600 hover:underline"
                                onClick={() => handleEditClick(user)}
                                >Editar</button>
                                <button
                                className="ml-2 text-red-600 hover:underline"
                                onClick={() => handleDelete(user.id)}
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
            
            {!showUserRegister && (
                <div className="block md:hidden mt-2 space-y-4">
                    {filteredUsers?.map((user) => ( 
                        <div key={user.id} className="p-4 bg-white rounded-lg shadow border border-gray-300"> 
                            <p>
                                <span className="font-semibold">Nombre:</span> {user.name}</p> 
                            <p>
                                <span className="font-semibold">Email:</span> {user.email}</p> 
                            <div>
                                <span className="font-semibold">Roles:</span> 
                                <ul className="list-disc pl-5">
                                    {user.roles.map((role) => (
                                        <li key={role.id}>{role.name}</li>
                                     ))}
                                </ul>
                            </div> 
                            <div className="mt-2 flex justify-end space-x-2"> 
                                <button onClick={() => handleEditClick(user)} className="text-blue-600 hover:underline">Editar</button> 
                                <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:underline">Eliminar</button> 
                            </div> 
                        </div> ))}
                </div>
            )}            
            {showUserRegister && (
                <div id="user_register" className="">
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
                            <div>
                                <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Correo</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="block w-full rounded-md border py-1.5 text-gray-900"
                                />
                            </div>
                            <div>
                                <label htmlFor="company" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nombre Empresa</label>
                                <select
                                    id="companyName"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    required
                                    disabled={!!formData.company}
                                    >
                                    <option value="">
                                        Selecciona una Empresa
                                    </option>
                                    {companies?.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="company" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nombre Empresa</label>
                                <input
                                    id="company"
                                    name="company"
                                    type="text"
                                    value={formData.company}
                                    onChange={handleInputChange}
                                    onBlur={handleCompanyBlur}
                                    required
                                    className="block w-full rounded-md border py-1.5 text-gray-900"
                                    disabled={!!formData.companyName}
                                />
                            </div>
                            <div>
                                <div>
                                    <label htmlFor="roles" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Rol</label>
                                    <select
                                        id="rol"
                                        name="rol"
                                        value={formData.rol}
                                        onChange={handleInputChange}
                                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        required
                                        >
                                        <option value="" disabled>
                                            Selecciona un rol
                                        </option>
                                        {roles?.map((item) => (
                                            <option key={item.id} value={item.id}>
                                            {item.name}
                                            </option>
                                        ))}
                                    </select>

                                </div>
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

export default Userpage;