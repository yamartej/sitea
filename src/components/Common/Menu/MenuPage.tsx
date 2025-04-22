"use client"
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useMenu } from "@/context/MenuContext";
import Spinner from "../Spinner/SpinnerPage";
import React, { Children, useState } from "react";
import { Item, MenuMap, MenuItem, DropdownState} from "@/types/type";

const MenuPage =()=>{
    const { data: session, status} = useSession();
    const userImage = session?.user.image || '/default-avatar.png';
    const userName = session?.user.name || '';
    const userEmail = session?.user.email || '';
    const { menuItems, loading } = useMenu();
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [dropdownStates, setDropdownStates] = useState<Record<number, boolean>>({});
    
        const organizeMenu = (menuItems: MenuItem[]): MenuItem[] => {
      const menuMap: MenuMap = menuItems.reduce((acc, item) => {
        acc[item.id] = { ...item, children: [] };
        return acc;
      }, {} as MenuMap);
    
      menuItems.forEach((item) => {
        if (item.parent_id) {
          // Verificar si el parent_id existe en menuMap
          if (menuMap[item.parent_id]) {
            menuMap[item.parent_id].children?.push(menuMap[item.id]);
          } else {
            console.warn(`Parent ID ${item.parent_id} not found for item ID ${item.id}`);
          }
        } else {
          menuMap[item.id].isTopLevel = true; // Marcar como de nivel superior para renderizar
          menuMap[item.id].children = []; // Inicializar array de hijos vacío
        }
      });
    
      // Extraer los elementos de nivel superior del mapa
      const organizedMenu = Object.values(menuMap).filter((item) => item.isTopLevel);
    
      return organizedMenu;
    };

    const toggleDropdownProfile = () => {
      setIsDropdownVisible((prev) => !prev);
    };

    
    
    const handleSignOut = () => 
      { 
        clearLocalStorage(); 
        signOut({ 
          callbackUrl: "/pages/login", 
        }); 
      };

    const toggleDropdown = (item: Item) => {
      setDropdownStates((prevState: DropdownState) => ({
          ...prevState,
          [item.id]: !prevState[item.id],
      }));
  };
    
    const toggleSidebar = () => { 
      setIsSidebarVisible(!isSidebarVisible); 
    };

    const clearLocalStorage = () => 
      { 
        localStorage.removeItem("menuItems"); 
        localStorage.removeItem("user"); 
      };
    
    if (loading) { 
      return (
        <div className="spinner-container">
          <Spinner/>
        </div>   
      ) 
    };

    const organizedItems = organizeMenu(menuItems as any);
    
    if (status === "unauthenticated") { 
      signOut({ 
        callbackUrl: "/pages/login", 
      });
    };

    const closeMenu = () => {
      setIsSidebarVisible(false); // Cerrar el menú lateral
      // 
    }

    return (
      <>
        <nav className="fixed top-0 z-50 w-full bg-primary-menu border-b border-gray-200 dark:border-gray-700">
          <div className="px-3 py-3 lg:px-5 lg:pl-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-start rtl:justify-end">
                <button
                  onClick={toggleSidebar}
                  data-drawer-target="logo-sidebar"
                  data-drawer-toggle="logo-sidebar"
                  aria-controls="logo-sidebar"
                  type="button"
                  className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                >
                  <span className="sr-only">Open sidebar</span>
                  <svg
                    className="w-6 h-6"
                    aria-hidden="true"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      clipRule="evenodd"
                      fillRule="evenodd"
                      d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                    />
                  </svg>
                </button>
                <a href="https://flowbite.com" className="flex ms-2 md:me-24">
                  <img
                    src="https://flowbite.com/docs/images/logo.svg"
                    className="h-8 me-3"
                    alt="FlowBite Logo"
                  />
                  <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-white">
                    Flowbite
                  </span>
                </a>
              </div>
              <div className="flex items-center">
                <div className="flex items-center ms-3">
                  <div className="">
                    <button
                      onClick={toggleDropdownProfile}
                      type="button"
                      className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                      aria-expanded={isDropdownVisible}
                      data-dropdown-toggle="dropdown-user"
                    >
                      <span className="sr-only">Open user menu</span>
                      <img
                        src={userImage}
                        className="w-8 h-8 rounded-full"
                        alt="user photo"
                      />
                    </button>
                  </div>
                  {isDropdownVisible && (
                    <div
                      className="my-4 text-base list-none bg-white divide-y divide-gray-100 rounded shadow dark:bg-gray-700 dark:divide-gray-600"
                      id="dropdown-user"
                    >
                      <div className="px-4 py-3" role="none">
                        <p className="text-sm text-gray-900 dark:text-white" role="none">
                          {userName}
                        </p>
                        <p
                          className="text-sm font-medium text-gray-900 truncate dark:text-gray-300"
                          role="none"
                        >
                          {userEmail}
                        </p>
                      </div>
                      <ul className="py-1" role="none">
                        <li>
                          <a
                            href="#"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                            role="menuitem"
                          >
                            Settings
                          </a>
                        </li>
                        <li>
                          <a
                            href="#"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                            role="menuitem"
                          >
                            Sign out
                          </a>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>
        <aside
          id="logo-sidebar"
          className={`${
            isSidebarVisible ? "" : "transition-transform -translate-x-full"
          } fixed top-0 left-0 z-40 w-64 h-screen pt-20 bg-menu-primary border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700`}
          aria-label="Sidebar"
        >
          <div className="h-full pb-4 overflow-y-auto bg-menu-primary dark:bg-gray-800">
            <ul className="space-y-2 font-medium">
              <li>
                <Link
                  href="/pages/dashboard"
                  className="flex items-center p-2 dark:text-white hover:bg-[#72cb10] hover:text-white group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                    />
                  </svg>
                  <span className="ms-3">Dashboard</span>
                </Link>
              </li>
              {organizedItems.map((item) => (
                <li key={item.id}>
                  {item.children && item.children?.length > 0 ? (
                    <div>
                      <button
                        onClick={() => toggleDropdown(item as any)}
                        type="button"
                        className="flex items-center w-full p-2 text-base transition duration-75 group hover:bg-[#72cb10] hover:text-white dark:text-white dark:hover:bg-[#00bfa5]"
                        aria-controls={`dropdown-${item.name}`}
                        data-collapse-toggle={`dropdown-${item.name}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
                          />
                        </svg>
        
                        <span className="flex-1 ms-3 text-left rtl:text-right whitespace-nowrap">
                          {item.name}
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m19.5 8.25-7.5 7.5-7.5-7.5"
                          />
                        </svg>
                      </button>
                      <ul
                        className={`${
                          dropdownStates[item.id] ? "" : "hidden"
                        } py-2 space-y-2`}
                      >
                        {item.children &&
                          item.children.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={child.url}
                                className="flex items-center w-full p-2 transition duration-75 pl-11 group hover:bg-[#72cb10] hover:text-white dark:text-white dark:hover:bg-[#00bfa5]"
                                onClick={closeMenu} // Cerrar el menú al hacer clic
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ) : (
                    <Link
                      href={item.url}
                      className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-[#00bfa5] hover:text-white group"
                      onClick={closeMenu} // Cerrar el menú al hacer clic
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                      <span className="ms-3">{item.name}</span>
                    </Link>
                  )}
                </li>
              ))}
              <li>
                <button
                  onClick={handleSignOut}
                  className="flex btn-attr-sing-out items-center p-2 dark:text-white hover:bg-[#72cb10] hover:text-white group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                  <span className="flex-1 ms-3 whitespace-nowrap">Sign Out</span>
                </button>
              </li>
            </ul>
          </div>
        </aside>
      </>
    )
}
export default MenuPage;