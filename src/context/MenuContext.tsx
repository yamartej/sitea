"use client"
import { createContext, useContext, useState, useEffect } from "react";
import { fetchMenuItems } from "@/app/api/menu/api";
import { getSession } from 'next-auth/react';
import { MenuItem, MenuContextType, Role} from "@/types/type";

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        const session = await getSession();
        const token = session?.user.token;
        const roles = session?.user.roles || [];
        if (token) {
          const items = await fetchMenuItems(token as string, roles);
          setMenuItems(items);
          localStorage.setItem("menuItems", JSON.stringify(items)); // Guardar en localStorage
        }
      } catch (error) {
        console.error("Error loading menu:", error);
      } finally {
        setLoading(false);
      }
    };

    const storedMenuItems = localStorage.getItem("menuItems");
    if (storedMenuItems) {
      setMenuItems(JSON.parse(storedMenuItems));
      setLoading(false);
    } else {
      loadMenuItems();
    }
  }, []);

  return (
    <MenuContext.Provider value={{ menuItems, loading }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return context;
};
