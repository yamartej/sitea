"use client";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useMenu } from "@/context/MenuContext";
import Spinner from "../Spinner/SpinnerPage";
import React, { Children, useState } from "react";
import { Item, MenuMap, MenuItem, DropdownState } from "@/types/type";
import {
  ChartPieIcon,
  AdjustmentsHorizontalIcon,
  PresentationChartBarIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  DocumentCurrencyDollarIcon,
  PercentBadgeIcon,
  ChevronDoubleRightIcon,
  ChevronRightIcon,
  MinusIcon,
  PencilSquareIcon,
  QuestionMarkCircleIcon,
  NumberedListIcon,
  Bars3Icon,
} from "@heroicons/react/24/solid";

const MenuPage = () => {
  const { data: session, status } = useSession();
  const userImage = session?.user.image || "/default-avatar.png";
  const userName = session?.user.name || "";
  const userEmail = session?.user.email || "";
  const { menuItems, loading } = useMenu();
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [dropdownStates, setDropdownStates] = useState<Record<number, boolean>>(
    {}
  );

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
          console.warn(
            `Parent ID ${item.parent_id} not found for item ID ${item.id}`
          );
        }
      } else {
        menuMap[item.id].isTopLevel = true; // Marcar como de nivel superior para renderizar
        menuMap[item.id].children = []; // Inicializar array de hijos vacío
      }
    });

    // Extraer los elementos de nivel superior del mapa
    const organizedMenu = Object.values(menuMap).filter(
      (item) => item.isTopLevel
    );

    return organizedMenu;
  };

  const iconMap = {
    ChartPieIcon: ChartPieIcon,
    AdjustmentsHorizontalIcon: AdjustmentsHorizontalIcon,
    PresentationChartBarIcon: PresentationChartBarIcon,
    ShoppingCartIcon: ShoppingCartIcon,
    CurrencyDollarIcon: CurrencyDollarIcon,
    DocumentCurrencyDollarIcon: DocumentCurrencyDollarIcon,
    PercentBadgeIcon: PercentBadgeIcon,
    DashboardIcon: ChartPieIcon,
    SettingsIcon: AdjustmentsHorizontalIcon,
    SalesIcon: ShoppingCartIcon,
    ReportsIcon: DocumentCurrencyDollarIcon,
    DefaultIcon: ChevronDoubleRightIcon,
    StockIcon: NumberedListIcon,
  };

  const toggleDropdownProfile = () => {
    setIsDropdownVisible((prev) => !prev);
  };

  const handleSignOut = () => {
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

  const clearLocalStorage = () => {
    localStorage.removeItem("menuItems");
    localStorage.removeItem("user");
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <Spinner />
      </div>
    );
  }

  const organizedItems = organizeMenu(menuItems as any);

  if (status === "unauthenticated") {
    signOut({
      callbackUrl: "/pages/login",
    });
  }

  const closeMenu = () => {
    setIsSidebarVisible(false); // Cerrar el menú lateral
    //
  };

  return (
    <>
      <div>
        <div className="fixed top-0 left-0 w-full z-30 p-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            data-drawer-target="sidebar-multi-level-sidebar"
            data-drawer-toggle="sidebar-multi-level-sidebar"
            aria-controls="sidebar-multi-level-sidebar"
            type="button"
            className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex items-center ml-auto">
            <img
              src={userImage}
              className="w-8 h-8 rounded-full"
              alt="user photo"
            />
            <div className="flex items-center text-primary-contrast space-x-2">
              <span className="text-base font-semibold whitespace-nowrap">
                {userName}
              </span>
              <a
                href="/edit-profile"
                className="text-gray-400 hover:text-gray-200"
                title="Editar Perfil"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </a>
              <a
                href="/help"
                className="text-gray-400 hover:text-gray-200"
                title="Ayuda / Información del Sistema"
              >
                <QuestionMarkCircleIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        <aside
          id="sidebar-multi-level-sidebar"
          className={`${
            isSidebarVisible ? "" : "transition-transform -translate-x-full"
          } fixed top-0 left-0 z-40 w-64 h-screen bg-menu transition-transform -translate-x-full sm:translate-x-0`}
          aria-label="Sidebar"
        >
          {/* Este div actuará como el contenedor flex para todo el contenido del sidebar */}
          <div className="h-full px-3 py-4 flex flex-col">
            {/* Parte superior del menú: Logo y botón de cerrar */}
            <div className="flex items-center justify-between mb-5">
              <Link href="/" className="flex items-center">
                <img
                  src="/logo.png"
                  className="h-10 w-10 me-3 bg-white rounded-full"
                  alt="Logo"
                />
                <span className="self-center text-xl font-semibold whitespace-nowrap text-primary-contrast">
                  Total<strong>PLUS</strong>
                </span>
              </Link>
              <button
                type="button"
                onClick={toggleSidebar}
                className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              >
                <span className="sr-only">Close sidebar</span>
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
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10l-4.293-4.293a1 1 0 010-1.414z"
                  />
                </svg>
              </button>
            </div>

            {/* Contenedor principal de los enlaces del menú */}
            {/* Este div ya no necesita `overflow-y-auto` si el contenido principal se desborda y el de salida siempre está al fondo */}
            <div className="flex-1 overflow-y-auto">
              {" "}
              {/* 'flex-1' permite que este div crezca y ocupe el espacio disponible */}
              <ul className="space-y-2 font-medium">
                <li>
                  <Link
                    href="/pages/dashboard"
                    className="flex items-center p-2 rounded-full bg-btn-menu group"
                  >
                    <ChartPieIcon className="size-6" />
                    <span className="ms-3">Dashboard</span>
                  </Link>
                </li>
                {organizedItems.map((item) => {
                  const IconComponent =
                    iconMap[item.icon as keyof typeof iconMap];
                  return (
                    <li key={item.id}>
                      {item.children && item.children?.length > 0 ? (
                        <div>
                          <a
                            onClick={() => toggleDropdown(item as any)}
                            type="button"
                            className="flex items-center p-2 rounded-full bg-btn-menu group"
                            aria-controls={`dropdown-${item.name} `}
                            data-collapse-toggle={`dropdown-${item.name} `}
                          >
                            {IconComponent && (
                              <IconComponent
                                className="shrink-0 w-5 h-5 transition duration-75"
                                aria-hidden="true"
                              />
                            )}

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
                          </a>
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
                                    className="flex items-center p-2 rounded-full bg-btn-menu-active group pl-11"
                                  >
                                    <MinusIcon className="size-3" />
                                    {/* Cambié ChevronDoubleRightIcon por ChevronRightIcon */}
                                    {child.name}
                                  </Link>
                                </li>
                              ))}
                          </ul>
                        </div>
                      ) : (
                        <Link
                          href={item.url}
                          className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group"
                        >
                          <ChevronRightIcon className="size-3" />
                          <span className="ms-3">{item.name}</span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Opción de salida del sistema, con `mt-auto` para empujarlo al final */}
            <ul className="space-y-2 font-medium mt-auto">
              {/* Opción de Cerrar Sesión */}
              <li>
                <a
                  onClick={handleSignOut}
                  className="flex items-center p-2 rounded-full bg-btn-menu group"
                >
                  <svg
                    className="shrink-0 w-5 h-5 transition duration-75 rotate-180"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 18 16"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 8h11m0 0L8 4m4 4-4 4m4-11h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"
                    />
                  </svg>
                  <span className="flex-1 ms-3 whitespace-nowrap">
                    Cerrar Sesión
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
};
export default MenuPage;
