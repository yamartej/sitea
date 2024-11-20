"use client"
import { useEffect, useState } from "react"; 
import { fetchUsersList } from "@/app/api/admin/api";
import { getSession } from 'next-auth/react';
import { User } from "@/types/type";
import { Spinner } from "react-bootstrap";

const Userpage = () =>{ 
    const [users, setUsers] = useState<User[]>([]);
    const [showSpinner, setShowSpinner] = useState(false);
    
    useEffect(() => { 
        setShowSpinner(true);
        const fetchUsers  = async () => { 
            const session = await getSession(); 
            try {
                
                const data = await fetchUsersList(session?.user.token as string);
                setUsers(data); 
              } catch (error) {
                console.error("Error fetching users:", error);
              }
              finally{
                setShowSpinner(false);
              }
        }; 
        fetchUsers (); 
    }, []);
    
     return (
        <>
            {showSpinner && (
            <div className="spinner-container">
                <Spinner/>  
            </div>              
            )}
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
                    {users?.map((user : User) => (
                        <tr className="bg-white hover:bg-gray-100 transition">
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
                            <button className="text-blue-600 hover:underline">Editar</button>
                            <button className="ml-2 text-red-600 hover:underline">Eliminar</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            
            <div className="block md:hidden mt-2 space-y-4">
                {users?.map((user) => ( 
                    <div key={user.id} className="p-4 bg-white rounded-lg shadow border border-gray-300"> 
                        <p>
                            <span className="font-semibold">Nombre:</span> {user.name}</p> 
                        <p>
                            <span className="font-semibold">Email:</span> {user.email}</p> 
                        <p>
                            <span className="font-semibold">Roles:</span> 
                            <ul className="list-disc pl-5">
                                {user.roles.map((role) => (
                                    <li key={role.id}>{role.name}</li>
                                 ))}
                            </ul>
                        </p> 
                        <div className="mt-2 flex justify-end space-x-2"> 
                            <button className="text-blue-600 hover:underline">Editar</button> 
                            <button className="text-red-600 hover:underline">Eliminar</button> 
                        </div> 
                    </div> ))}
            </div>
        </>
    )
}

export default Userpage;