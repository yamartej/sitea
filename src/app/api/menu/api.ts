import axios from "axios";
import { MenuItem } from "@/types/type";

const apiUrl = process.env.NEXT_PUBLIC_URL_API;

/**
 * Roles are intentionally NOT sent by the browser.
 * Laravel derives roles from the authenticated Sanctum user.
 */
export const fetchMenuItems = async (
  token: string
): Promise<MenuItem[]> => {
  try {
    const response = await axios.post(
      `${apiUrl}/menu_items`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      console.error(
        "Error en la API:",
        error.response.status,
        error.response.data
      );
    } else if (error.request) {
      console.error("Sin respuesta de la API:", error.request);
    } else {
      console.error("Error al configurar Axios:", error.message);
    }
  } else {
    console.error("Error inesperado:", error);
  }

  throw error;
}
};
