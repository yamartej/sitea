"use client"
import { createContext, useContext, useState, useEffect } from "react";
import { fetchMenuItems } from "@/app/api/menu/api";
import { useSession } from "next-auth/react";
import { MenuItem, MenuContextType, Role} from "@/types/type";

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session} = useSession();
  const token = session?.user.token;
  const roles: Role[] = session?.user.roles || [];
  useEffect(() => {
    const loadMenuItems = async () => {
      try {
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
