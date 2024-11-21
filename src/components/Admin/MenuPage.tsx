"use client"
import { useEffect,useState } from "react";
import { getSession } from 'next-auth/react';
import { fetchRoleList, fetchMenuList} from "@/app/api/admin/api";
import { Role, MenuItem, MenuMap } from "@/types/type";

const MenuPage = () =>{
    const [showSpinner, setShowSpinner] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [menuOptions, setMenuOptions] = useState<MenuItem[]>([]);
    const organizeMenu = (menuItems: MenuItem[]): MenuItem[] => {
        const menuMap: MenuMap = menuItems.reduce((acc, item) => {
          acc[item.id] = { ...item, children: [] };
          return acc;
        }, {} as MenuMap);
    
        menuItems.forEach((item) => {
          if (item.parent_id) {
            menuMap[item.parent_id].children?.push(menuMap[item.id]);
          } else {
            menuMap[item.id].isTopLevel = true; // Marcar como de nivel superior para renderizar
            menuMap[item.id].children = []; // Inicializar array de hijos vacío
          }
        });
        
    
        // Extract the top-level menu items from the map
        const organizedMenu = Object.values(menuMap).filter(
          (item) => item.isTopLevel
        );
        
        return organizedMenu;
      };
    useEffect(() => { 
        setShowSpinner(true);
        const fetchRoles  = async () => { 
            const session = await getSession(); 
            try {
                
                const data = await fetchRoleList(session?.user.token as string);
                setRoles(data); 
              } catch (error) {
                console.error("Error fetching roles:", error);
              }
              finally{
                setShowSpinner(false);
              }
        }; 
        const fetchMenuOptions  = async () => { 
            const session = await getSession(); 
            try {
                
                const data = await fetchMenuList(session?.user.token as string);
                setMenuOptions(data); 
              } catch (error) {
                console.error("Error fetching menu options:", error);
              }
              finally{
                setShowSpinner(false);
              }
        }; 
        fetchRoles (); 
        fetchMenuOptions (); 
        
    }, []);

    const organizedItems = organizeMenu(menuOptions);
    console.log(organizedItems)
    return(
        <>
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <div className="flex items-center justify-between flex-column md:flex-row flex-wrap space-y-4 md:space-y-0 py-4 bg-white dark:bg-gray-900">
                    <div>
                        <button id="dropdownActionButton" data-dropdown-toggle="dropdownAction" className="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700" type="button">
                            <span className="sr-only">Action button</span>
                                Action
                            <svg className="w-2.5 h-2.5 ms-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m1 1 4 4 4-4" />
                            </svg>
                        </button>
                        <div id="dropdownAction" className="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700 dark:divide-gray-600">
                            <ul className="py-1 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownActionButton">
                                <li>
                                    <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Reward</a>
                                </li>
                                <li>
                                    <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Promote</a>
                                </li>
                                <li>
                                    <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Activate account</a>
                                </li>
                            </ul>
                            <div className="py-1">
                                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Delete User</a>
                            </div>
                        </div>
                    </div>
                    <label htmlFor="table-search" className="sr-only">Search</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                            </svg>
                        </div>
                        <input type="text" id="table-search-users" className="block pt-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Search for users" />
                    </div>
                </div>
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    
                                </th>
                                {roles?.map((item) => ( 
                                    <th key={item.id} scope="col" className="px-6 py-3">
                                        {item.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {organizedItems.map((item) => (
                                <tr key={item.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    {item.children && item.children?.length > 0 ?  
                                    (
                                        <th scope="row" className="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white">
                                            <div className="ps-3">
                                                <div className="text-base font-semibold">{item.name}</div>
                                                {item.children && item.children.map((child) => (
                                                    <div className="font-normal text-gray-500">{child.name}</div>
                                                ))}
                                            </div>
                                        </th>
                                    ):(
                                        <th scope="row" className="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap dark:text-white">
                                            <div className="ps-3">
                                                <div className="text-base font-semibold">{item.name}Jairo</div>
                                            </div>  
                                        </th>
                                        
                                    )}
                                    
                                </tr>
                            ))}
                        </tbody>
                </table>
            </div>
        </>
    )
    
}
export default MenuPage;