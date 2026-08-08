"use client";
import React, { useEffect, useState } from "react";
import { getSession } from 'next-auth/react';
import { fetchPermissions, saveDataPermissions } from "@/app/api/admin/api";
import { Role, MenuItem, Permission } from "@/types/type";
import Spinner from "../Common/Spinner/SpinnerPage";
import Notification from "../Common/Notification/NotificationPage";

const PermissionPage = () => {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<{ [roleId: number]: { [menuId: number]: boolean } }>({});
  const [showSpinner, setShowSpinner] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [typeMessage, setTypeMessage] = useState("error");

  useEffect(() => {
    setShowSpinner(true);
    const getData = async () => {
      const session = await getSession();
      try {
        setShowSpinner(true);
        const { roles: rolesData, menus: menusData, permissions: permissionsData } = await fetchPermissions(session?.user.token as string);

        // Transformar los datos de permisos en un formato más fácil de usar
        const permissionsMap: { [roleId: number]: { [menuId: number]: boolean } } = {};
        permissionsData.forEach((permission: Permission) => {
          if (!permissionsMap[permission.role_id]) {
            permissionsMap[permission.role_id] = {};
          }
          permissionsMap[permission.role_id][permission.menu_id] = !!permission.can_access;
        });

        // Organizar el menú
        const organizedMenus = menusData.filter((menu: MenuItem) => menu.parent_id === null).map((parentMenu: MenuItem) => ({
          ...parentMenu,
          children: menusData.filter((menu: MenuItem) => menu.parent_id === parentMenu.id)
        }));

        setMenus(organizedMenus);
        setRoles(rolesData);
        setPermissions(permissionsMap);
      } catch (error) {
        console.error("Error fetching permissions:", error);
        setErrorMessage("Error fetching permissions");
        setShowNotification(true);
      } finally {
        setShowSpinner(false);
        if (showNotification) {
          const timer = setTimeout(() => {
              setShowNotification(false);
          }, 10000); // 10 segundos
    
          return () => clearTimeout(timer); // Limpia el temporizador al desmontar o cambiar
        }
      }
    };
    getData();
  }, []);

  const handlePermissionChange = (roleId: number, menuId: number, isParent: boolean) => {
    setPermissions((prevPermissions) => {
      const updatedPermissions = {
        ...prevPermissions,
        [roleId]: {
          ...prevPermissions[roleId],
          [menuId]: prevPermissions[roleId] ? !prevPermissions[roleId][menuId] : true,
        },
      };

      if (isParent) {
        menus.forEach((menu: MenuItem) => {
          if (menu.children) {
            menu.children.forEach((child: MenuItem) => {
              updatedPermissions[roleId][child.id] = updatedPermissions[roleId][menuId];
            });
          }
        });
      }

      return updatedPermissions;
    });
  };

  const savePermissions = async () => {
    setShowSpinner(true);
    const permissionsArray: Permission[] = [];

    for (const roleId in permissions) {
      for (const menuId in permissions[roleId]) {
        if (typeof permissions[roleId][menuId] === 'boolean') {
          permissionsArray.push({
            id: 0, 
            role_id: parseInt(roleId),
            menu_id: parseInt(menuId),
            can_access: permissions[roleId][menuId],
          });
        }
      }
    }

    try {
      const session = await getSession();
      if (!session) {
        throw new Error('No session found');
      }

      await saveDataPermissions(session.user.token, permissionsArray);
      setShowNotification(true);
      setTypeMessage("success");
      setErrorMessage("Permisos actualizados correctamente"); 
      setShowSpinner(false);
    } catch (error) {
      console.error("Error al guardar permisos:", error);
      setTypeMessage("error");
      setErrorMessage("Hubo un error al actualizar los permisos. Por favor, inténtalo de nuevo."); 
      setShowSpinner(false);
    }
  };

  return (
    <>
      <div>
        {showSpinner && (
          <div className="spinner-container">
            <Spinner />
          </div>
        )}
      </div>
      <div>
        {showNotification && errorMessage && (
          <Notification
            message={errorMessage}
            type={typeMessage}
            onClose={() => setShowNotification(false)} />
        )}
      </div>
      
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase border-b border-t">
              <tr className="bg-gray-200">
                <th className="px-4 py-2 border border-gray-300">Menú</th>
                {roles.map((role) => (
                  <th key={role.id} className="px-4 py-2 border border-gray-300">{role.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {menus.map((menu: MenuItem) => {
                const isParent = menu.children && menu.children.length > 0;
                const isUnique = !isParent && menu.parent_id === null;
                return (
                  <React.Fragment key={menu.id}>
                    <tr className={`odd:bg-white bg-gray-100 hover:bg-gray-100 transition ${isUnique || isParent ? 'font-bold text-blue-600' : ''}`}>
                      <td className={`px-4 py-2 border border-gray-300 ${menu.parent_id !== null ? 'pl-8' : ''}`}>{menu.name}</td>
                      {roles.map((role) => (
                        <td key={role.id} className="px-4 py-2 border border-gray-300 text-center">
                          {(isUnique || menu.parent_id !== null) ? (
                            <input
                              type="checkbox"
                              checked={permissions[Number(role.id)]?.[Number(menu.id)] ?? false}
                              onChange={() => handlePermissionChange(Number(role.id), Number(menu.id), Boolean(isParent))}
                            />
                          ) : (
                            <></>
                          )}
                        </td>
                      ))}
                    </tr>
                    {isParent && menu.children?.map((submenu: MenuItem) => (
                      <tr key={submenu.id} className="bg-white hover:bg-gray-100 transition">
                        <td className="px-4 py-2 border border-gray-300 pl-8">{submenu.name}</td>
                        {roles.map((role) => (
                          <td key={role.id} className="px-4 py-2 border border-gray-300 text-center">
                            <input
                              type="checkbox"
                              checked={permissions[Number(role.id)]?.[Number(submenu.id)] ?? false}
                              onChange={() => handlePermissionChange(Number(role.id), submenu.id, false)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        <button onClick={savePermissions} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Guardar Cambios</button>
     
    </>
  );
};

export default PermissionPage;
