"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { fetchMenuItems } from "@/app/api/menu/api";
import {
  MenuContextType,
  MenuItem,
} from "@/types/type";

const MenuContext =
  createContext<MenuContextType | undefined>(
    undefined
  );

export const MenuProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data: session, status } = useSession();
  const token = session?.user?.token;
  const [menuItems, setMenuItems] =
    useState<MenuItem[]>([]);
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    // Menus are authorization-sensitive and must not be restored
    // from a shared, potentially stale browser cache.
    localStorage.removeItem("menuItems");

    const loadMenuItems = async () => {
      if (status === "loading") {
        if (!cancelled) setLoading(true);
        return;
      }

      if (!token) {
        if (!cancelled) {
          setMenuItems([]);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) setLoading(true);

      try {
        // Laravel derives roles from the authenticated Sanctum token.
        const items = await fetchMenuItems(token);

        if (!cancelled) {
          setMenuItems(Array.isArray(items) ? items : []);
        }
      } catch (error) {
        console.error("Error loading menu:", error);
        if (!cancelled) setMenuItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadMenuItems();

    const onPermissionsUpdated = () => {
      void loadMenuItems();
    };

    window.addEventListener(
      "totalplus:permissions-updated",
      onPermissionsUpdated
    );

    return () => {
      cancelled = true;
      window.removeEventListener(
        "totalplus:permissions-updated",
        onPermissionsUpdated
      );
    };
  }, [token, status]);

  return (
    <MenuContext.Provider
      value={{
        menuItems,
        loading,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);

  if (!context) {
    throw new Error(
      "useMenu must be used within a MenuProvider"
    );
  }

  return context;
};
