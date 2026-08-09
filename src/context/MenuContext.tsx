"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { getSession } from "next-auth/react";
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
  const [menuItems, setMenuItems] =
    useState<MenuItem[]>([]);
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        const session = await getSession();
        const token = session?.user.token;

        if (!token) {
          setMenuItems([]);
          return;
        }

        /*
         * Phase 1C-1:
         * The authenticated backend user determines roles.
         * Never send client-controlled role IDs.
         */
        const items =
          await fetchMenuItems(token);

        setMenuItems(items);

        localStorage.setItem(
          "menuItems",
          JSON.stringify(items)
        );
      } catch (error) {
        console.error(
          "Error loading menu:",
          error
        );
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };

    const storedMenuItems =
      localStorage.getItem("menuItems");

    if (storedMenuItems) {
      try {
        setMenuItems(
          JSON.parse(storedMenuItems)
        );
        setLoading(false);
      } catch {
        localStorage.removeItem(
          "menuItems"
        );
        void loadMenuItems();
      }
    } else {
      void loadMenuItems();
    }
  }, []);

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
